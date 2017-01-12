---
title: Contributing
component: senssoft
---

First, thank you for contributing to Apache SensSoft!

There are certain procedures that must be followed for all contributions. These procedures are necessary to allow us to allocate resources for reviewing and testing your contribution, as well as to communicate effectively with you during the review process.

See individual product guides for product-specific information on getting started as a contributor, setup and testing, code style, etc.

To report a bug or other issue, simply create an issue in JIRA, as described in Step 1 below.

#### 1. Create an issue in JIRA

   All changes to Apache Distill must have a corresponding issue in [JIRA](https://issues.apache.org/jira/browse/SENSSOFT) so the change can be properly tracked.  If you do not already have an account on Apache JIRA, you will need to create one before creating your new issue.

#### 2. Make and test your changes locally

   The Apache SensSoft source code is maintained in [several git repositories](https://git-wip-us.apache.org/repos/asf?s=senssoft) hosted by Apache.  These repositories are mirrored and more easily available [on GitHub](https://github.com/apache?q=senssoft).  To make your changes, fork the appropriate GitHub repository and make commits to a topic branch in your fork.  Commits should be made in logical units and must reference the JIRA issue number:
   ```shell
   git commit -m "#SENSSOFT-123: #High-level message describing the changes."
   ```
   Avoid commits which cover multiple, distinct goals that could (and should) be handled separately.  If you do not already have an account on JIRA, you will need to create one to claim an issue, discuss development, or report results.

#### 3. Submit your changes via a pull request on GitHub

   Once your changes are ready, submit them by creating a pull request for the corresponding topic branch you created when you began working on your changes.  The core team will then review your changes and, if they pass review, your changes will be merged into the primary Apache-hosted repos.
