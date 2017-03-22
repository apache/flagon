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
from flask import Flask, request

from distill import app as test_app

def test_example ():
	assert True
	# with test_app.test_client () as c:
	# 	rv = c.get ('/?tequila=42')
	# 	assert request.args ['tequila'] == '42'

# import os
# import flaskr
# import unittest
# import tempfile

# class FlaskrTestCase(unittest.TestCase):

#     def setUp(self):
#         self.db_fd, flaskr.app.config['DATABASE'] = tempfile.mkstemp()
#         flaskr.app.config['TESTING'] = True
#         self.app = flaskr.app.test_client()
#         flaskr.init_db()

#     def tearDown(self):
#         os.close(self.db_fd)
#         os.unlink(flaskr.app.config['DATABASE'])

# if __name__ == '__main__':
#     unittest.main()