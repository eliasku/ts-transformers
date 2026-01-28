Let Field refer to a field/method/property. Henceforth, we will refer to the identifier/name of the Field.

Let us describe the concept of Visibility for a Field. In the application, a Field identifier can be private or public. Fields of the JSON structure loaded from external sources must not have their names changed in the interface. This also applies to field names in request objects (request body JSON). Similarly, all methods, properties, and fields of the entire DOM API, NodeJS API, etc. However, fields used exclusively within the application scope may be designated as private. The names of such fields/properties/methods can be aggressively renamed throughout all their usage.

Task 1. [COMPLETED] Unify the internal/private concepts into a single private concept. Currently, we have `internal` and `private` designations and characteristics that differ. I propose consolidating them into simply public (cannot be renamed) and private (can be renamed) fields.
