<!--
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->

# Contributing to Flagon UserALE

There are many ways to contribute to Flagon UserALE, just one of which is by contributing code.
Community building, maintenance, and documentation is just as important, if not more so for the
longevity of UserALE. We welcome all forms of contributions.

<!-- TODO: Insert link to official website about more ways to get plugged in.  -->

## Code Contributions

*Before opening a pull request*, review the UserALE contribution guide below.
It lists steps that are required before creating a PR and provides tips for
getting started. In particular, consider the following:

- Have you searched for existing, related Issues and pull requests?
- Have you shared your intent by creating an issue and commenting that you plan to take it on?
- If the change is large, have you discussed it on the [dev@](emailto:dev@flagon.apache.org) mailing list?
- Is the change being proposed clearly explained and motivated?

These steps and instructions on getting started are outlined below as well.

### Prerequisites

- A [GitHub](https://github.com/) account.
- A Linux, macOS, or Microsoft Windows development environment.
- Node >= v18.x installed (we strongly recommend using [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)).
- [Docker](https://www.docker.com/) installed for some tasks including building the example server and testing changes to this website locally.
- For large contributions, a signed [Individual Contributor License.
  Agreement](https://www.apache.org/licenses/icla.pdf) (ICLA) to the Apache
  Software Foundation (ASF).

### Share Your Intent
1. Find or create an issue in the [UserALE repo](https://github.com/apache/flagon-useralejs/issues/new/choose).
   Tracking your work in an issue will avoid duplicated or conflicting work, and provide
   a place for notes. Later, your pull request will be linked to the issue as well.
<!-- 2. Comment ".take-issue" on the issue. This will cause the issue to be assigned to you. -->
<!--    When you've completed the issue, you can close it by commenting ".close-issue". -->
<!--    If you are a committer and would like to assign an issue to a non-committer, they must comment -->
<!--    on the issue first; please tag the user asking them to do so or to comment "\`.take-issue\`". -->
<!--    The command will be ignored if it is surrounded by `\`` markdown characters. -->
2. If your change is large or it is your first change, it is a good idea to
   [discuss it on the dev@flagon.apache.org mailing list](https://flagon.apache.org/community).
3. For large changes create a design doc
   ([template](https://s.apache.org/beam-design-doc-template)
    and email it to the dev@flagon.apache.org mailing list).

### Setup Your Environment and Learn About Language Specific Setup

<!-- Before you begin, check out the Wiki pages. There are many useful tips about [Git](https://cwiki.apache.org/confluence/display/BEAM/Git+Tips), [Go](https://cwiki.apache.org/confluence/display/BEAM/Go+Tips), [Gradle](https://cwiki.apache.org/confluence/display/BEAM/Gradle+Tips), [Java](https://cwiki.apache.org/confluence/display/BEAM/Java+Tips), [Python](https://cwiki.apache.org/confluence/display/BEAM/Python+Tips), etc. -->

#### Configuring Dependencies and Tooling

UserALE has dependencies on the following for development purposes:

- Node >= v18.X
- Go (for installing [Apache Skywalking Eyes](https://github.com/apache/skywalking-eyes) to check license headers)

For Node, we strongly recommend using Node Version Manage (NVM), especially if you want to run the test suite against multiple node versions locally. Depending on your operating system, the steps for setting up these dependencies vary slightly.

##### Windows Users

For windows users, we strongly recommend you use Windows Subsystem for Linux (WSL) to develop in. There is generally better support for most development tools we use across the Flagon family. 

Instructions to install WSL can be found [here](https://learn.microsoft.com/en-us/windows/wsl/setup/environment?source=recommendations). You need only follow them through the update and upgrade packages section. If you are a VSCode user, we also recommend the [WSL extension](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-vscode).

If you do use WSL, jump down to the [Unix Users section](#configuration-unix) for further instructions on setting up dependencies and tooling. Otherwise, continue here.

###### Installing Node

The simplest way to install one or more versions of node is to install and use [nvm-windows](https://github.com/coreybutler/nvm-windows), the NVM utility for windows. 

> *_Important:_* It is always recommended to remove any existing installations of Node.js or npm from your operating system before installing a version manager as the different types of installation can lead to strange and confusing conflicts. This includes deleting any existing Node.js installation directories (e.g., "C:\Program Files\nodejs") that might remain. NVM's generated symlink will not overwrite an existing (even empty) installation directory. 

Once the installation is complete, open PowerShell (recommended opening with elevated Admin permissions) and try using windows-nvm to list which version of Node are currently installed (should be none if you properly removed existing installations): `nvm ls`.

We then recommend you install the most recent version of Node with long-term support LTS (v22.3.0 as of this writing (2024-06-13)):
```sh
nvm list available
```
Then install the LTS version number with:
```sh
nvm install <version>
```
###### Installing Go

Head to the [Go release page](https://go.dev/doc/install), download the Go installer and then follow the instructions in the "Windows" tab.

##### Unix (MacOS/Linux) Users {#configuration-unix}

###### Installing Node

1. Install [Node Version Manager (NVM)](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating).
2. Check your install was successful (and `nvm` was added to the path), by re-opening your terminal and running `nvm version`. This should return your installed version number.
3. Install Node v18 LTS
```sh
nvm install 18 --lts
nvm use 18
```

###### Installing Go

Head to the [Go release page](https://go.dev/doc/install), download the Go installer and then follow the instructions in the "Linux" or "Mac" tab, depending on your OS.

#### Development Setup {#development-setup}

1. Check [Git workflow tips](https://cwiki.apache.org/confluence/display/BEAM/Git+Tips) if you need help with git forking, cloning, branching, committing, pull requests, and squashing commits (thanks to the Apache Beam community for such a great resource).

2. Make a fork of https://github.com/apache/flagon-useralejs repo.

3. Clone the forked repository. You can download it anywhere you like.
    ```sh
    mkdir -p ~/path/to/your/folder
    cd ~/path/to/your/folder
    git clone https://github.com/forked/apache/flagon-useralejs
    cd flagon-useralejs
    ```

4. Install the project dependencies.

   ```sh
   npm install
   ```
   In addition to the node packages being installed, the post-install hook should also install Skywalking Eye's `license-eye` utility. To check that it was installed and works, run:
   ```sh
   npm run license:check
   ```
   UserALE uses Husky to run pre-commit hooks, an automated script to ensure your code changes follow required conventions and help increase your PR's chances of success before your code ever reaches remote. To install it:
   ```sh
   npm run prepare
   ```

5. Familiarize yourself with the project structure.

   The library follows standard organization conventions:
      - `build` contains the build artifacts. These are committed to source to ensure the repo itself is a self-contained "latest" release.
      - `examples` contains examples for how to extend UserALE and use it with various web stacks.
      - `journey` contains our end-to-end browser tests.
      - `src` the library's source code. Please note, the library consists of of the core javascript library as well as a browser plugin which can be found in `build/UserALEWebExtension`. The plugin depends on the core library.
      - `test` contains our unit test suite.

6. Make sure you can build and run tests.

   UserALE is written in Typescript. We use Rollup to compile the library into javascript files, create source maps, and build our typescript types (`d.ts` files). The build artifacts also mirror the source code insofar as the browser plugin is bundled into it's own directory for easy installation.

   You must first build the library before running tests:
   ```sh
   npm run build
   npm test
   ```

### Create a Pull Request

1. Make your code change. Every source file needs to include the Apache license header. You can run `npm run license:fix` to automatically add a license header to *almost& every file type that requires one. Every new dependency needs to
   have an open source license [compatible](https://www.apache.org/legal/resolved.html#criteria) with Apache.

2. Add unit tests for your change.

3. Use descriptive commit messages that make it easy to identify changes and provide a clear history.

4. When your change is ready to be reviewed and merged, create a pull request.

5. Link to the issue you are addressing in your pull request.

6. The pull request and any changes pushed to it will trigger continuous integration (CI) jobs in GH actions that run tests across all supported versions of Node. There are currently no known flaky tests. Therefore, if your tests fail, it is likely due to one of your code changes and you will have to work to fix it.

### Review Process and Releases

#### Get Reviewed

Your pull requests should automatically list recommended reviewers. Please select one to ensure your PR is reviewed in a timely fashion. We are working on improving our developer experience by adding automation tools to streamline things such as this in the future. We appreciate your patience!

1. Pull requests can only be merged by a
   [Flagon committer](https://home.apache.org/phonebook.html?pmc=flagon).
   To find a committer for your area, either:
  - look for similar code merges, or
  - ask on [dev@flagon.apache.org](emailto:dev@flagon.apache.org)

   Use `R: @username` in the pull request to notify a reviewer.

2. If you don't get any response in 3 business days, email the [dev@flagon.apache.org mailing list](emailto:dev@flagon.apache.org) to ask for someone to look at your pull request.

#### Make the Reviewer’s Job Easier

1. Provide context for your changes in the associated issue and/or PR description.

2. Avoid huge mega-changes. "Mega-changes" should first be discussed on the Dev mailing list or in a GH issue, preferably both, and, if there's interest, the community will work with you to break the changes up into bite size tickets.

3. Review feedback typically leads to follow-up changes. It is easier to review follow-up changes when they are added as additional "fixup" commits to the
   existing PR/branch. This allows reviewer(s) to track the incremental progress and focus on new changes,
   and keeps comment threads attached to the code.
   Please refrain from squashing new commits into reviewed commits before review is completed.
   Because squashing reviewed and unreviewed commits often makes it harder to
   see the difference between the review iterations, reviewers may ask you to unsquash new changes.

4. After review is complete and the PR is accepted, fixup commits should be squashed (see [Git workflow tips](https://cwiki.apache.org/confluence/display/BEAM/Git+Tips)).
   Flagon committers can squash all commits in the PR during merge; however, if a PR has a mixture of independent changes that should not be squashed, and fixup commits,
   then the PR author should help squashing fixup commits to maintain a clean commit history.

#### Apache Flagon UserALE Releases

Apache Flagon UserALE does not *yet* adhere to a fixed minor release schedule. However, we are discussing a 6 week cadence. We tend to cut a release upon completion of new development [milestones](https://github.com/apache/flagon-useralejs/milestones). If you want to see your changes released sooner, email the [dev@flagon.apache.org](emailto:dev@flagon.apache.org) and we will work to the best of our abilities to cut a release sooner.

#### Stale Pull Requests

The community will close stale pull requests in order to keep the project
healthy. A pull request becomes stale after its author fails to respond to
actionable comments for 60 days.  Author of a closed pull request is welcome to
reopen the same pull request again in the future.

<!-- ### Troubleshooting -->
<!---->
<!-- If you run into any issues, check out the [contribution FAQ](https://cwiki.apache.org/confluence/display/BEAM/Contributor+FAQ) or ask on the [dev@ mailing list](https://beam.apache.org/community/contact-us/) or [#beam channel of the ASF Slack](https://beam.apache.org/community/contact-us/). -->
<!---->
<!-- If you didn't find the information you were looking for in this guide, please -->
<!-- [reach out to the Beam community](https://beam.apache.org/community/contact-us/). -->


## Find Efforts to Contribute to
A great way to contribute is to join an existing effort. If you want to get involved but don’t have a project in mind, check our [current milestones](https://github.com/apache/flagon-useralejs/milestones). These are areas where our core committers are actively working and most likely to be able to provide extra attention to your contributions as you ramp up your involvement.

## Contributing to the Developer Documentation

New contributors are often best equipped to find gaps in the developer documentation.
If you'd like to contribute to our documentation, either open a PR in the UserALE repo with
the proposed changes or make edits to the [Flagon wiki](https://cwiki.apache.org/confluence/display/flagon).

By default, everyone has read access to the wiki. If you wish to contribute changes,
please create an account and request edit access on the dev@flagon.apache.org mailing list (include your Wiki account user ID).

