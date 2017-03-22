# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import absolute_import
from setuptools import setup, find_packages
import distutils.cmd
import distutils.log
from setuptools.command.test import test as TestCommand
import io, os, sys, subprocess

if sys.version_info[:2] < (2, 7):
    m = "Python 2.7 or later is required for Distill (%d.%d detected)."
    raise ImportError (m % sys.version_info[:2])

if sys.argv[-1] == 'setup.py':
    print ("To install, run 'python setup.py install'")
    print ()
    
def read (*filenames, **kwargs):
    encoding = kwargs.get ('encoding', 'utf-8')
    sep = kwargs.get ('sep', '\n')
    buf = []
    for filename in filenames:
        with io.open (filename, encoding=encoding) as f:
            buf.append (f.read ())
    return sep.join (buf)

# Get the version string
def get_version ():
    basedir = os.path.dirname (__file__)
    with open (os.path.join (basedir, 'distill/version.py')) as f:
        version = {}
        exec (f.read (), version)
        return version['__version__']
    raise RuntimeError ('No version info found.')

setup (
    name = "Distill",
    version = get_version (),
    url = "https://github.com/apache/incubator-senssoft-distill",
    license = "Apache Software License",
    author = "Michelle Beard",
    author_email = "msbeard@apache.org",
    description = "An analytical framework for UserALE.",
    long_description = __doc__,
    classifiers = [
      'Development Status :: 4 - Beta',
      'Programming Language :: Python',
      'Programming Language :: Python :: 2.7',
      'Natural Language :: English',
      'Environment :: Web Environment',
      'Intended Audience :: Developers',
      'License :: OSI Approved :: Apache Software License',
      'Operating System :: OS Independent', 
      'Private :: Do Not Upload"'
    ],
    keywords = "stout userale tap distill", # Separate with spaces
    packages = find_packages (exclude=['examples', 'tests']),
    include_package_data = True,
    zip_safe = False,
    setup_requires = ['pytest-runner'],
    tests_require = ['pytest>=3.0.0', 'pytest-pylint', 'coverage'],
    install_requires = ['Flask==0.10.1', 
                        #'networkx==1.11',
                        'elasticsearch-dsl==2.0.0', 
                        #'numpy>=1.10.0', 
                        #'scipy>=0.17.0',
                        'pandas>=0.18.1'
    ],
    entry_points = {
      'console_scripts': [
        'dev = distill.server:dev_server'
        ]
    }
)