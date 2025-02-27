====================
Processing Functions
====================
Distill provides analysts with three main processing functions: one function for searching UserALE logs and two
functions that help to transform iterables into tuples.  These functions are described below:

Search
-------
Distill's search function, ``find_meta_values``, uses list comprehension to list out all the unique values for a specific
key in a dictionary.  This can be particularly useful when attempting to list out unique values in UserALE logs.  An
example usage of this function can be seen below:

.. code:: python

    # Sorted dictionary of UserALE logs
    sorted_dict

    # List of unique values for the target field
    target_vals = distill.find_meta_values('target', sorted_dict, unique=True)

Transform
---------
Distill's transformation functions: ``pairwiseStag`` and ``pairwiseSeq``, create tuples based on an iterable series or
list.  These tuples can then be used as edge lists.  Example usages of both of these functions can be seen below:

.. code:: python

    test_list = [1, 2, 3, 4]

    stag_result = distill.pairwiseStag(test_list)   # [(1, 2), (3, 4)]
    seq_result = distill.pairwiseSeq(test_list)     # [(1, 2), (2, 3), (3, 4)]
