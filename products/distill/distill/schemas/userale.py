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
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import (
    AliasGenerator,
    BaseModel,
    Field,
    field_serializer,
    field_validator,
    model_validator,
)
from pydantic.alias_generators import to_camel
from pydantic.config import ConfigDict

from distill.schemas.base import BaseSchema


class Browser(BaseModel):
    browser: Optional[str] = None
    version: Optional[str] = None


class Location(BaseModel):
    x: Optional[Union[int, float]] = None
    y: Optional[Union[int, float]] = None


class ScrnRes(BaseModel):
    width: int
    height: int


class Details(BaseModel):
    model_config = ConfigDict(extra="allow")
    window: Optional[bool] = None


def _otlp_any_value_to_python(val: Any) -> Any:
    if not isinstance(val, dict):
        return val
    if "stringValue" in val:
        return val["stringValue"]
    if "boolValue" in val:
        return val["boolValue"]
    if "intValue" in val:
        try:
            return int(val["intValue"])
        except (ValueError, TypeError):
            return val["intValue"]
    if "doubleValue" in val:
        return val["doubleValue"]
    if "arrayValue" in val and isinstance(val["arrayValue"], dict):
        return [
            _otlp_any_value_to_python(item)
            for item in val["arrayValue"].get("values", [])
        ]
    if "kvlistValue" in val and isinstance(val["kvlistValue"], dict):
        return {
            entry["key"]: _otlp_any_value_to_python(entry.get("value"))
            for entry in val["kvlistValue"].get("values", [])
            if isinstance(entry, dict) and "key" in entry
        }
    return val


def normalize_userale_dict(
    data: Any, resource_attrs: Optional[Dict[str, Any]] = None
) -> Any:
    """
    Normalizes a Protobuf v1 JSON UserALELog or an OpenTelemetry OTLP/JSON
    LogRecord into the flat UserALE dictionary structure expected by Distill.
    """
    if not isinstance(data, dict):
        return data

    # 1. Protobuf v1 JSON (apache.flagon.userale.v1.UserALELog)
    log_type_enum = data.get("logType")
    if log_type_enum in (
        "LOG_TYPE_RAW",
        "LOG_TYPE_INTERVAL",
        "LOG_TYPE_CUSTOM",
    ) or any(k in data for k in ("raw", "interval", "custom")):
        case_key = (
            "interval"
            if "interval" in data
            else "custom"
            if "custom" in data
            else "raw"
        )
        inner = data.get(case_key)
        if isinstance(inner, dict):
            meta = inner.get("metadata") or {}
            flat: Dict[str, Any] = {
                "target": inner.get("target") or "#document",
                "path": inner.get("path") or [],
                "pageUrl": meta.get("pageUrl", ""),
                "pageTitle": meta.get("pageTitle", ""),
                "pageReferrer": meta.get("pageReferrer", ""),
                "browser": {"browser": None, "version": None},
                "userAgent": meta.get("userAgent"),
                "type": inner.get("eventType") or case_key,
                "logType": case_key,
                "userAction": bool(inner.get("userAction", False)),
                "userId": meta.get("userId"),
                "toolVersion": meta.get("toolVersion"),
                "toolName": meta.get("toolName"),
                "useraleVersion": meta.get("useraleVersion"),
                "sessionId": meta.get("sessionId"),
                "httpSessionId": meta.get("httpSessionId"),
                "browserSessionId": meta.get("browserSessionId"),
            }
            if case_key == "interval":
                flat.update(
                    {
                        "count": int(inner.get("count", 0)),
                        "duration": int(inner.get("duration", 0)),
                        "startTime": int(inner.get("startTime", 0)),
                        "endTime": int(inner.get("endTime", 0)),
                        "targetChange": bool(inner.get("targetChange", False)),
                        "typeChange": bool(inner.get("typeChange", False)),
                    }
                )
            else:
                scrn = meta.get("screenResolution") or {
                    "width": 0,
                    "height": 0,
                }
                loc = inner.get("location") or {"x": None, "y": None}
                flat.update(
                    {
                        "clientTime": int(meta.get("clientTime", 0)),
                        "microTime": inner.get("microTime", 0),
                        "location": {
                            "x": loc.get("x"),
                            "y": loc.get("y"),
                        },
                        "scrnRes": {
                            "width": int(scrn.get("width", 0)),
                            "height": int(scrn.get("height", 0)),
                        },
                        "details": inner.get("details"),
                    }
                )
                if "attributes" in inner:
                    flat["attributes"] = inner["attributes"]
                if "style" in inner:
                    flat["style"] = inner["style"]
                if isinstance(inner.get("customFields"), dict):
                    flat.update(inner["customFields"])
            return flat

    # 2. OpenTelemetry OTLP/JSON LogRecord
    if "timeUnixNano" in data and "attributes" in data and isinstance(
        data["attributes"], list
    ):
        res = resource_attrs or {}
        attrs = {
            item["key"]: _otlp_any_value_to_python(item.get("value"))
            for item in data["attributes"]
            if isinstance(item, dict) and "key" in item
        }
        log_type = str(attrs.get("flagon.log_type", "raw"))
        event_type = str(attrs.get("flagon.event_type", log_type))
        time_ms = int(data["timeUnixNano"]) // 1_000_000
        body_val = _otlp_any_value_to_python(data.get("body"))
        details = body_val if isinstance(body_val, dict) else None

        flat = {
            "target": attrs.get("flagon.target") or "#document",
            "path": attrs.get("flagon.path") or [],
            "pageUrl": attrs.get("url.full", ""),
            "pageTitle": attrs.get("page.title", ""),
            "pageReferrer": attrs.get("page.referrer", ""),
            "browser": {
                "browser": res.get("browser.name"),
                "version": res.get("browser.version"),
            },
            "userAgent": res.get("user_agent.original"),
            "type": event_type,
            "logType": log_type,
            "userAction": bool(attrs.get("flagon.user_action", True)),
            "userId": attrs.get("user.id"),
            "toolVersion": res.get("service.version"),
            "toolName": res.get("service.name"),
            "useraleVersion": res.get("telemetry.sdk.version"),
            "sessionId": res.get("session.id"),
            "httpSessionId": res.get("flagon.http_session_id"),
            "browserSessionId": res.get("flagon.browser_session_id"),
        }
        if data.get("traceId"):
            flat["traceId"] = data["traceId"]
        if data.get("spanId"):
            flat["spanId"] = data["spanId"]

        if log_type == "interval":
            flat.update(
                {
                    "count": int(attrs.get("flagon.interval.count", 1)),
                    "duration": int(
                        attrs.get("flagon.interval.duration_ms", 0)
                    ),
                    "startTime": int(
                        attrs.get("flagon.interval.start_time_ms", time_ms)
                    ),
                    "endTime": int(
                        attrs.get("flagon.interval.end_time_ms", time_ms)
                    ),
                    "targetChange": bool(
                        attrs.get("flagon.interval.target_change", False)
                    ),
                    "typeChange": bool(
                        attrs.get("flagon.interval.type_change", False)
                    ),
                }
            )
        else:
            flat.update(
                {
                    "clientTime": time_ms,
                    "microTime": (int(data["timeUnixNano"]) % 1_000_000)
                    / 1_000_000,
                    "location": {
                        "x": attrs.get("flagon.location.x"),
                        "y": attrs.get("flagon.location.y"),
                    },
                    "scrnRes": {
                        "width": int(res.get("screen.width", 0)),
                        "height": int(res.get("screen.height", 0)),
                    },
                    "details": details,
                }
            )
            if isinstance(attrs.get("flagon.target_rect"), dict):
                flat["targetRect"] = attrs["flagon.target_rect"]
        return flat

    return data


def extract_logs(payload: Union[Dict[str, Any], List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Extracts a list of normalized flat UserALE log dicts from:
    - a standard UserALE JSON array,
    - a Protobuf v1 LogBatch dict ({"logs": [...]}), or
    - an OTLP/JSON ExportLogsServiceRequest dict ({"resourceLogs": [...]}).
    """
    if isinstance(payload, list):
        return [normalize_userale_dict(item) for item in payload]
    if isinstance(payload, dict):
        if "logs" in payload and isinstance(payload["logs"], list):
            return [normalize_userale_dict(item) for item in payload["logs"]]
        if "resourceLogs" in payload and isinstance(payload["resourceLogs"], list):
            results: List[Dict[str, Any]] = []
            for rl in payload["resourceLogs"]:
                res_attrs = {
                    item["key"]: _otlp_any_value_to_python(item.get("value"))
                    for item in rl.get("resource", {}).get("attributes", [])
                    if isinstance(item, dict) and "key" in item
                }
                for sl in rl.get("scopeLogs", []):
                    for lr in sl.get("logRecords", []):
                        results.append(normalize_userale_dict(lr, res_attrs))
            return results
        return [normalize_userale_dict(payload)]
    return []


class UserAleBaseSchema(BaseSchema):
    """
    A raw, interval, or custom log produced by UserAle
    """

    model_config = ConfigDict(extra="allow")

    target: Optional[str] = None
    path: Optional[List[str]] = None
    page_url: str
    page_title: Optional[str] = None
    page_referrer: Optional[str] = None
    browser: Optional[Browser] = None
    type_field: Optional[str] = Field(
        default=None, validation_alias="type", serialization_alias="type"
    )
    log_type: str
    user_action: bool
    user_id: Optional[str] = None
    tool_version: Optional[str] = None
    tool_name: Optional[str] = None
    userale_version: Optional[str] = None
    session_id: Optional[str] = None
    http_session_id: Optional[str] = None
    browser_session_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _normalize_wire_formats(cls, data: Any) -> Any:
        return normalize_userale_dict(data)

    def _timestamp(self):
        """
        Returns:
            float: POSIX time from userALE log's client_time field
        """
        pass


class UserAleIntervalSchema(UserAleBaseSchema):
    """
    An interval log produced by UserAle
    """

    model_config = ConfigDict(
        title="IntervalLog",
        extra="allow",
        alias_generator=AliasGenerator(
            validation_alias=to_camel, serialization_alias=to_camel
        ),
    )

    count: int
    duration: int
    start_time: int
    end_time: int
    target_change: bool
    type_change: bool

    @field_validator("start_time", "end_time")
    def validate_st(cls, st: float):
        return datetime.fromtimestamp(st / 1000)

    @field_serializer("start_time", "end_time")
    def serialize_st(self, st: datetime):
        return int(st.timestamp() * 1000)

    def _timestamp(self):
        """
        Returns:
            float: POSIX time from userALE log's start_time field
        """
        return self.start_time.timestamp()


class UserAleRawSchema(UserAleBaseSchema):
    """
    A raw or custom log produced by UserAle
    """

    model_config = ConfigDict(
        title="RawLog",
        extra="allow",
        alias_generator=AliasGenerator(
            validation_alias=to_camel, serialization_alias=to_camel
        ),
    )

    client_time: int
    micro_time: Optional[Union[int, float]] = None
    location: Optional[Location] = None
    scrn_res: Optional[ScrnRes] = None
    details: Optional[Union[Dict[str, Any], str]] = None

    @field_validator("client_time")
    def validate_ct(cls, ct: float):
        return datetime.fromtimestamp(ct / 1000)

    @field_serializer("client_time")
    def serialize_ct(self, ct: datetime):
        return int(ct.timestamp() * 1000)

    def _timestamp(self):
        """
        Returns:
            float: POSIX time from userALE log's client_time field
        """
        return self.client_time.timestamp()
