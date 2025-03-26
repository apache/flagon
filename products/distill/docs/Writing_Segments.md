> \<!\-\--Licensed to the Apache Software Foundation (ASF) under one or
> more contributor license agreements. See the NOTICE file distributed
> with this work for additional information regarding copyright
> ownership. The ASF licenses this file to You under the Apache License,
> Version 2.0 (the \"License\"); you may not use this file except in
> compliance with the License. You may obtain a copy of the License at
>
> > <http://www.apache.org/licenses/LICENSE-2.0>
>
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an \"AS IS\" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
> implied. See the License for the specific language governing
> permissions and limitations under the License. \-\--\>

# Writing Segments

Along with the creation of `Segment` objects, analysts also need a way
to easily access the UserALE logs associated with each `Segment`.
Distill\'s Segmentation package allows analysts to do this through the
use of the `write_segment` function.

## Write Segment

The `write_segment` function creates a nested dictionary of segment
names to UIDs which then map to individual logs (i.e
result\[\'segment_name\'\]\[uid\] \--\> log). This assists with easy
iteration over defined `Segment` objects.

``` python
# Sorted dictionary of UserALE logs
sorted_dict

# List of segment names
segment_names = ["segment1", "segment2"]

# Time tuples
start_end_vals = [(start_time_1, end_time_1), (start_time_2, end_time_2)]

# Write Segments
segments = distill.write_segment(sorted_dict, segment_names, start_end_vals)
```

The above code looks similar to the `create_segments` example usage,
however, rather than returning a `Segments` object, this code will
create a dictionary of segment names to UIDs to individual UserALE logs.

Since `Segments` objects support list comprehensions, the usage of the
`write_segment` functon after curating a collection of `Segment` objects
is simple. Below is some example code that shows how this can be done
with a `Segments` object:

``` python
# Sorted dictionary of UserALE logs
sorted_dict

# Segments object
segments

# Create list of segment names
segment_names = [segment.segment_name for segment in segments]

# Create list of start and end values
start_end_vals = [segment.start_end_val for segment in segments]

written_segments = distill.write_segments(sorted_dict, segment_names, start_end_vals)
```
