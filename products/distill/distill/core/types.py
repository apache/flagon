# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from typing import TYPE_CHECKING, Dict, List, Union

from pydantic.type_adapter import TypeAdapter
from typing_extensions import TypeAliasType

from distill.schemas.userale import UserAleIntervalSchema, UserAleRawSchema

if TYPE_CHECKING:
    from typing_extensions import TypeAlias

    JSONSerializable: TypeAlias = Union[
        str,
        int,
        float,
        bool,
        None,
        List["JSONSerializable"],
        Dict[str, "JSONSerializable"],
    ]
    JsonDict: TypeAlias = Dict[str, JSONSerializable]
else:
    # TypeAliasType avoids recursion errors when validating with Pydantic v2
    JSONSerializable = TypeAliasType(
        "JSONSerializable",
        Union[
            str,
            int,
            float,
            bool,
            None,
            List["JSONSerializable"],
            Dict[str, "JSONSerializable"],
        ],
    )
    JsonDict = Dict[str, JSONSerializable]

Timestamp = Union[str, int, float]

UserAleSchema = TypeAdapter(Union[UserAleRawSchema, UserAleIntervalSchema])
