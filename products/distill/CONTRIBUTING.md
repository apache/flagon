<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
-->

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

::: {#contributing}
Contributing to Apache Flagon Distill
\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--##TO DO:
Update for WIP-Package
:::

Thank you for contributing to the Distill project!

There are certain procedures that must be followed for all
contributions. These procedures are necessary to allow us to allocate
resources for reviewing and testing your contribution, as well as to
communicate effectively with you during the review process.

1)  Create an issue in JIRA

    > All changes to Distill must have a corresponding issue in JIRA so
    > the change can be properly tracked:
    >
    > > <https://issues.apache.org/jira/browse/senssoft>
    >
    > If you do not already have an account on JIRA, you will need to
    > create before creating your new issue.

2)  Make and test your changes locally

    > The Distill source is maintained in a git repository hosted on
    > Apache:
    >
    > > <https://git-wip-us.apache.org/repos/asf/incubator-senssoft-distill.git>
    >
    > To make your changes, fork the repository and make commits to a
    > topic branch in your fork. Commits should be made in logical units
    > and must reference the JIRA issue number:
    >
    >     $ git commit -m "#SENSSOFT-123: #High-level message describing the changes."
    >
    > Avoid commits which cover multiple, distinct goals that could (and
    > should) be handled separately.
    >
    > If you do not already have an account on JIRA, you will need to
    > create one before making your changes.

3)  Submit your changes via a pull request on Git

    > Once your changes are ready, submit them by creating a pull
    > request for the corresponding topic branch you created when you
    > began working on your changes.
    >
    > The Apache SensSoft team will then review your changes and, if
    > they pass review, your changes will be merged.
