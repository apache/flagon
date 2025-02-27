from typing import Dict, List, Union

from pydantic.type_adapter import TypeAdapter
from typing_extensions import TypeAliasType

from distill.schemas.userale import UserAleRawSchema, UserAleIntervalSchema

# TypeAliasType is necessary to avoid recursion error when validating this
# type with Pydantic
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

JsonDict = Dict[str, "JSONSerializable"]

Timestamp = Union[str, int, float]

UserAleSchema = TypeAdapter(Union[UserAleRawSchema, UserAleIntervalSchema])
