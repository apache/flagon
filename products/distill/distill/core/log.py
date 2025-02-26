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
import json
from typing import Dict, Union

from pksuid import PKSUID
from datetime import datetime
from pydantic import BaseModel, parse_obj_as
from pydantic.type_adapter import TypeAdapter

from distill.core.types import JsonDict, JSONSerializable, UserAleSchema

ta = TypeAdapter(JsonDict)


class Log:
    """
    Base class for log object representation.
    Arguments:
        data: a json parsable string or JsonObject to validate and parse
        schema: a pydantic schema from which to validate the provided log;
                defaults to UserAle log schema
    """

    def __init__(self, data: Union[str, JsonDict], schema=None):
        if schema is None:
            schema = UserAleSchema
        elif issubclass(schema, BaseModel):
            raise TypeError("schema should inherit from pydantic.BaseModel")

        if isinstance(data, str):
            hash_sfx = str(hash(data))
            data = json.loads(data)
        elif ta.validate_python(data):
            hash_sfx = str(hash(json.dumps(data)))
        else:
            raise TypeError(
                "ERROR: "
                + str(type(data))
                + " data should be either a string or a JsonDict"
            )
        self.data = schema.validate_python(data)

        self.id = PKSUID("log_" + hash_sfx, self.data._timestamp())

    def to_json(self) -> str:
        return self.data.model_dump_json(by_alias=True)

    def to_dict(self) -> JsonDict:
        return self.data.model_dump(by_alias=True)
    
    def __lt__(self, other):
        if isinstance(other, Log):
            return self.id < other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() < other
    
    def __le__(self, other):
        if isinstance(other, Log):
            return self.id <= other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() <= other
    
    def __gt__(self, other):
        if isinstance(other, Log):
            return self.id > other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() > other
    
    def __ge__(self, other):
        if isinstance(other, Log):
            return self.id > other.id
        if isinstance(other, datetime):
            return self.id.get_datetime() >= other
    
    def __ne__(self, other):
        if isinstance(other, Log):
            return self.data != other.data
        return NotImplemented
    
    def __eq__(self, other):
        if isinstance(other, Log):
            return self.data == other.data
        return NotImplemented
