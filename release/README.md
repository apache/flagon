Release Scripts and Helpers
===========================

This folder contains a number of items that will assist in the production of SensSoft releases.

Release scripts - make-release-artifacts.sh
-------------------------------------------
`make-release-artifacts.sh` will produce the release artifacts with appropriate signatures. It is recommended to use
this script rather than "rolling your own" or using a manual process, as this script codifies several Apache
requirements about the release artifacts.

These scripts are fully documented in **[Release Process](https://cwiki.apache.org/confluence/display/SENSSOFT/UserALE.js+Release+Management+Procedure)** page on Confluence.

Quickstart
----------
1. Configure environment/prepare for release. 
   ```bash
    ./clone-and-configure-repos.sh useralejs
   ```
   Ensure $APACHE_DIST_SVN_DIR is set in your environment.

1. Change working directory to incubator-senssoft-useralejs.
   ```bash
   cd incubator-senssoft-userale.js
   ```
   
1. Release.
   ```bash
   ../make-release-artifacts.sh -r 1
   ```