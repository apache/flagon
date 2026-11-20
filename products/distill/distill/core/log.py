#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Optional, Union

from pydantic import BaseModel
from pydantic.type_adapter import TypeAdapter

from distill.core.types import JsonDict, UserAleSchema

ta = TypeAdapter(JsonDict)

# Threshold separating POSIX seconds (< ~5138 CE) from epoch milliseconds.
_EPOCH_SECONDS_CUTOFF = 100_000_000_000


class LogId:
    """
    Deterministic, zero-dependency log identifier ordered by timestamp.
    Supports clientTime=0 and 64-bit post-2038 timestamps with millisecond precision.
    """

    def __init__(self, prefix: str, timestamp: Union[int, float] = 0):
        self.prefix = str(prefix)
        ts_val = float(timestamp)
        if abs(ts_val) < _EPOCH_SECONDS_CUTOFF:
            self.timestamp_ms = int(round(ts_val * 1000))
        else:
            self.timestamp_ms = int(round(ts_val))
        self._encoded = f"{self.prefix}_{self.timestamp_ms:016x}"

    def get_timestamp(self) -> int:
        return self.timestamp_ms // 1000

    def get_timestamp_ms(self) -> int:
        return self.timestamp_ms

    def get_datetime(self) -> datetime:
        return datetime.fromtimestamp(self.timestamp_ms / 1000, tz=timezone.utc)

    @classmethod
    def parse(cls, raw: str) -> "LogId":
        prefix, hex_ts = raw.rsplit("_", 1)
        obj = cls(prefix, 0)
        obj.timestamp_ms = int(hex_ts, 16)
        obj._encoded = raw
        return obj

    def __str__(self) -> str:
        return self._encoded

    def __repr__(self) -> str:
        return f"LogId(prefix={self.prefix!r}, timestamp_ms={self.timestamp_ms})"

    def __hash__(self) -> int:
        return hash((self.prefix, self.timestamp_ms))

    def __eq__(self, other: object) -> bool:
        if isinstance(other, LogId):
            return (
                self.timestamp_ms == other.timestamp_ms
                and self.prefix == other.prefix
            )
        return NotImplemented

    def __lt__(self, other: object) -> bool:
        if isinstance(other, LogId):
            return (self.timestamp_ms, self.prefix) < (
                other.timestamp_ms,
                other.prefix,
            )
        return NotImplemented

    def __le__(self, other: object) -> bool:
        if isinstance(other, LogId):
            return (self.timestamp_ms, self.prefix) <= (
                other.timestamp_ms,
                other.prefix,
            )
        return NotImplemented

    def __gt__(self, other: object) -> bool:
        if isinstance(other, LogId):
            return (self.timestamp_ms, self.prefix) > (
                other.timestamp_ms,
                other.prefix,
            )
        return NotImplemented

    def __ge__(self, other: object) -> bool:
        if isinstance(other, LogId):
            return (self.timestamp_ms, self.prefix) >= (
                other.timestamp_ms,
                other.prefix,
            )
        return NotImplemented


def _normalize_compare_datetime(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.astimezone(timezone.utc)
    return dt.astimezone(timezone.utc)


class Log:
    """
    Base class for log object representation.
    Arguments:
        data: a json parsable string or JsonObject to validate and parse
        schema: a pydantic schema from which to validate the provided log;
                defaults to UserAle log schema
    """

    def __init__(self, data: Union[str, JsonDict], schema: Optional[Any] = None):
        if schema is None:
            schema = UserAleSchema
        elif isinstance(schema, type) and issubclass(schema, BaseModel):
            schema = TypeAdapter(schema)
        elif not isinstance(schema, TypeAdapter):
            raise TypeError("schema should inherit from pydantic.BaseModel")

        if isinstance(data, str):
            data = json.loads(data)
        elif not ta.validate_python(data):
            raise TypeError(
                "ERROR: "
                + str(type(data))
                + " data should be either a string or a JsonDict"
            )
        self.data = schema.validate_python(data)
        canonical = json.dumps(
            self.data.model_dump(by_alias=True),
            sort_keys=True,
            separators=(",", ":"),
        )
        hash_sfx = hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:8]

        self.id = LogId("log_" + hash_sfx, self.data._timestamp())

    def to_json(self) -> str:
        return self.data.model_dump_json(by_alias=True)

    def to_dict(self) -> JsonDict:
        return self.data.model_dump(by_alias=True)

    def __lt__(self, other: object) -> bool:
        if isinstance(other, Log):
            return self.id < other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() < _normalize_compare_datetime(other)
        return NotImplemented

    def __le__(self, other: object) -> bool:
        if isinstance(other, Log):
            return self.id <= other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() <= _normalize_compare_datetime(other)
        return NotImplemented

    def __gt__(self, other: object) -> bool:
        if isinstance(other, Log):
            return self.id > other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() > _normalize_compare_datetime(other)
        return NotImplemented

    def __ge__(self, other: object) -> bool:
        if isinstance(other, Log):
            return self.id >= other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() >= _normalize_compare_datetime(other)
        return NotImplemented

    def __ne__(self, other: object) -> bool:
        if isinstance(other, Log):
            return self.data != other.data
        return NotImplemented

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Log):
            return self.data == other.data
        return NotImplemented
