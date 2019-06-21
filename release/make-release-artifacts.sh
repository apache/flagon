#!/bin/bash
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

# Creates the following releases with archives (.tar.gz/.zip), signatures and checksums:
#   binary  (-bin)     - contains the userale dist binary release
#   source  (-src)     - contains all the source code files that are permitted to be released

set -e

# Import common script and run clone for useralejs
release_script_dir=$( cd $( dirname $0 ) && pwd )
[ -f "${release_script_dir}/common.sh" ] || {
    echo >&2 "Could not find common.sh in the same directory as this script"
    exit 1
}
. "${release_script_dir}/common.sh"

###############################################################################
show_help() {
    cat >&2 <<END
Usage: make-release-artifacts.sh [-v version] [-r rc_number]
Prepares and builds the source and binary distribution artifacts of an Apache Flagon
release.

  -v VERSION                 overrides the name of this version, if detection
                             from package.json is not accurate for any reason.
  -r RC_NUMBER               specifies the release candidate number. The
                             produced artifact names include the 'rc' suffix,
                             but the contents of the archive artifact do *not*
                             include the suffix. Therefore, turning a release
                             candidate into a release requires only renaming
                             the artifacts.
  -y                         answers "y" to all questions automatically, to
                             use defaults and make this suitable for batch mode
  -n                         dry run - NPM deployments and SVN commits will
                             NOT be done. This will still delete working and
                             temporary files, however.

Specifying the RC number is required. Specifying the version number is
discouraged; if auto detection is not working, then this script is buggy.

Additionally if APACHE_DIST_SVN_DIR is set, this will transfer artifacts to
that directory.
END
}

###############################################################################
# Argument parsing
rc_suffix=
OPTIND=1
while getopts "h?v:r:y?:n?" opt; do
    case "$opt" in
        h|\?)
            show_help
            exit 0
            ;;
        v)
            current_version=$OPTARG
            ;;
        r)
            rc_suffix=$OPTARG
            ;;
        y)
            batch_confirm_y=true
            ;;
        n)
            dry_run=true
            ;;
        *)
            show_help
            exit 1
    esac
done

shift $((OPTIND-1))
[ "$1" = "--" ] && shift

###############################################################################
# Prerequisite checks
assert_in_project_root

detect_version

###############################################################################
# Determine all filenames and paths, and confirm

release_name=apache-flagon-useralejs-incubating-${current_version}
if [ -z "$rc_suffix" ]; then
    fail Specifying the RC number is required
else
    artifact_name=${release_name}
fi

userale_dir=$( pwd )
working_dir=${TMPDIR:-/tmp}release-working-dir
rm -rf ${working_dir}
staging_dir="${working_dir}/source/"
src_staging_dir="${working_dir}/source/${release_name}-src"
bin_staging_dir="${working_dir}/bin/"
artifact_dir="${release_script_dir}/${artifact_name}"

echo "The version is ${current_version}"
echo "The rc suffix is rc${rc_suffix}"
echo "The release name is ${release_name}"
echo "The artifact name is ${artifact_name}"
echo "The artifact directory is ${artifact_dir}"
if [ -z "${dry_run}" -a ! -z "${APACHE_DIST_SVN_DIR}" ] ; then
  echo "The artifacts will be copied to ${APACHE_DIST_SVN_DIR} and readied for commit"
else
  echo "The artifacts will not be copied into a Subversion working copy"
fi
echo "The working directory is ${working_dir}"
echo ""
confirm "Is this information correct? [y/N]" || exit
echo ""
echo "WARNING! This script will run 'git clean -dxf' to remove ALL files that are not under Git source control."
echo "This includes build artifacts and all uncommitted local files and directories."
echo "If you want to check what will happen, answer no and run 'git clean -dxn' to dry run."
echo ""
confirm || exit
if [ -z "${dry_run}" ]; then
    echo ""
    echo "This script will cause uploads to be made to a staging repository on the Apache Nexus server."
    echo ""
    confirm "Shall I continue?  [y/N]" || exit
fi

# Set up GPG agent
if [ ! -z "${GPG_AGENT_INFO}" ]; then
  echo "GPG_AGENT_INFO set; assuming gpg-agent is running correctly."
else
  eval $(gpg-agent --daemon --no-grab --write-env-file $HOME/.gpg-agent-info)
  GPG_TTY=$(tty)
  export GPG_TTY GPG_AGENT_INFO
fi

# A GPG no-op, but causes the password request to happen. It should then be cached by gpg-agent.
gpg2 -o /dev/null --sign /dev/null

# Discover submodules
# submodules="$( perl -n -e 'if ($_ =~ /path += +(.*)$/) { print $1."\n" }' < .gitmodules )"
# modules=". ${submodules}"

###############################################################################
# Clean the workspace
# for module in ${modules}; do ( cd $module && git clean -dxf ); done

###############################################################################
# Source release
echo "Creating source release folder called ${src_staging_dir} for ${release_name}"
set -x
mkdir -p ${src_staging_dir}

# exclude: 
# * docs (which isn't part of the release, and adding license headers to js files is cumbersome)
rsync -rtp --exclude .git\* --exclude userale-docs/ --exclude node_modules . ${staging_dir}/${release_name}-src

rm -rf ${artifact_dir}
mkdir -p ${artifact_dir}
set +x
echo "Creating artifact ${artifact_dir}/${artifact_name}-src.tar.gz and .zip"
set -x
( cd ${staging_dir} && tar czf ${artifact_dir}/${artifact_name}-src.tar.gz ${release_name}-src )
( cd ${staging_dir} && zip -qr ${artifact_dir}/${artifact_name}-src.zip ${release_name}-src )

# ###############################################################################
# Binary release
set +x
echo "Proceeding to build binary release in ${bin_staging_dir}"
set -x

mkdir -p ${bin_staging_dir}

# Perform the build
( cd ${src_staging_dir} && npm install && npm run build && npm test)

set +x
echo "Make artifacts"
set -x

# copy js, min version of userale.js, and webExt files
mkdir ${bin_staging_dir}/${release_name}-bin

cp -R ${src_staging_dir}/build/* ${bin_staging_dir}/${release_name}-bin

# copy in the LICENSE, README and NOTICE
cp ${src_staging_dir}/README.md ${bin_staging_dir}/${release_name}-bin
cp ${src_staging_dir}/LICENSE ${bin_staging_dir}/${release_name}-bin
cp ${src_staging_dir}/NOTICE ${bin_staging_dir}/${release_name}-bin

( cd ${bin_staging_dir} && tar czf ${artifact_dir}/${artifact_name}-bin.tar.gz ${release_name}-bin )
( cd ${bin_staging_dir} && zip -qr ${artifact_dir}/${artifact_name}-bin.zip ${release_name}-bin )

###############################################################################
# Signatures and checksums

# OSX doesn't have md5sum, sha1sum, and sha256sum, even if MacPorts md5sha1sum package is installed.
# Easy to fake it though.
which md5sum >/dev/null || alias md5sum='md5 -r' && shopt -s expand_aliases
which sha1sum >/dev/null || alias sha1sum='shasum -a 1' && shopt -s expand_aliases
which sha256sum >/dev/null || alias sha256sum='shasum -a 256' && shopt -s expand_aliases

( cd ${artifact_dir} &&
    for a in *.tar.gz *.zip; do
        md5sum ${a} > ${a}.md5
        gpg2 --print-md SHA512 ${a} > ${a}.sha512
        gpg2 --armor --output ${a}.asc --detach-sig ${a}
    done
)

###############################################################################
# Publish to dist repo

if [ -z "${dry_run}" -a ! -z "${APACHE_DIST_SVN_DIR}" ] ; then (
  cd ${APACHE_DIST_SVN_DIR}
  [ -d ${artifact_name} ] && ( svn --non-interactive revert -R ${artifact_name}; svn --non-interactive rm --force ${artifact_name}; rm -rf ${artifact_name} )
  cp -r ${artifact_dir} ${artifact_name}
  svn --non-interactive add ${artifact_name}
  )
  artifact_dir=${APACHE_DIST_SVN_DIR}/${artifact_name}
fi

###############################################################################
# Conclusion

set +x
echo "The release is done - here is what has been created:"
ls ${artifact_dir}
echo "You can find these files in: ${artifact_dir}"
echo "The git commit IDs for the voting emails are:"
echo -n "incubator-flagon-userale: " && git rev-parse HEAD
git submodule --quiet foreach 'echo -n "${name}: " && git rev-parse HEAD'