=================================
Combining Segments with Set Logic
=================================
``Segment`` objects can be combined with set logic.  Distill's Segmentation package provides three functions that perform
set logic: ``union``, ``intersection``, and ``difference``.

Union
-----
A union can be performed using the ``union`` function.  An example usage of this function is shown below:

.. code:: python

    # Segment 1
    segment1.get_uids()     #[uid1, uid2, uid3]

    # Segment 2
    segment2.get_uids()     #[uid3, uid4, uid5]

    # Perform Union
    new_segment = distill.union("new_segment", segment1, segment2)
    new_segment.get_uids()  #[uid1, uid2, uid3, uid4, uid5]

The above code will return a new ``Segment`` object with the given segment_name, start and end values based on the smallest
``clientTime`` and largest ``clientTime`` of the given ``Segment`` objects, and a list of the union of the UIDs of segment1
and segment2.

Intersection
------------
An intersection can be performed using the ``intersection`` function.  An example usage of this function is shown below:

.. code:: python

    # Segment 1
    segment1.get_uids()   #[uid1, uid3, uid6]

    # Segment 2
    segment2.get_uids()     #[uid3, uid6, uid9]

    new_segment = distill.intersection("new_segment", segment1, segment2)
    new_segment.get_uids()  #[uid3, uid6]

The above code will return a new ``Segment`` object (similarly to union) with UIDs that represent the intersection of the
UIDs of segment1 and segment2.

Difference
----------
The ``difference`` function creates a new ``Segment`` object based on the logical difference of two ``Segment`` objects.

.. code:: python

    # Segment 1
    segment1.get_uids()   #[uid1, uid2, uid3]

    # Segment 2
    segment2.get_uids()     #[uid2, uid4, uid5]

    new_segment1 = distill.difference("new_segment_1", segment1, segment2)
    new_segment1.get_uids()  #[uid1, uid3]

    new_segment2 = distill.difference("new_segment_2", segment2, segment1)
    new_segment2.get_uids()  #[uid4, uid5]

The above code will return a new ``Segment`` object (similarly to union and intersection) with UIDs that represent the difference
of the UIDs of segment1 and segment2.
