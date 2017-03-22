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

from flask import Flask, request, jsonify
from distill import app
from distill.models.brew import Brew
from distill.models.userale import UserAle
from distill.models.stout import Stout
from distill.algorithms.stats.hist import Hist

@app.route ('/', methods=['GET'])
def index ():	
	"""
	Show Distill version information, connection status, and all registered applications.

	.. code-block:: bash
	
		$ curl -XGET https://localhost:8090

		{
			"author" : "Michelle Beard",
			"email" : "mbeard@draper.com",
			"name": "Distill",
			"status" : true,
			"version" : "1.0",
			"applications" : {
				"xdata_v3" : {
					testing: 205,
					parsed: 500,
				},
				"test_app" : {
					logs: 500,
					parsed: 100,
				}
			}
		}

	:return: Distill's status information as JSON blob
	"""
	return jsonify (name="Distill", version="1.0 alpha", author="Michelle Beard", email="mbeard@draper.com", status=Brew.get_status (), applications=Brew.get_applications ())

@app.route ('/create/<app_id>', methods=['POST', 'PUT'])
def create (app_id):
	"""
	Registers an application in Distill. 

	.. code-block:: bash

		$ curl -XPOST https://localhost:8090/xdata_v3
	
	:param app_id: Application name
	:return: Newly created application's status as JSON blob
	"""
	return Brew.create (app_id)

@app.route ('/status/<app_id>', defaults={"app_type" : None}, methods=['GET'])
@app.route ('/status/<app_id>/<app_type>', methods=['GET'])
def status (app_id, app_type): 
	"""
	Presents meta information about an registered application, including field names and document types.

	.. code-block:: bash

		$ curl -XGET https://localhost:8090/status/xdata_v3

		{
		  "application": "xdata_v3",
		  "health": "green",
		  "num_docs": "433",
		  "status": "open"
		}

	:param app_id: Application name
	:return: Registered applications meta data as JSON blob
	"""
	return Brew.read (app_id, app_type=app_type)

@app.route ('/update/<app_id>', methods=['POST', 'PUT'])
def update (app_id):
	"""
	Renames a specific application 

	.. code-block:: bash

		$ curl -XPOST https://localhost:8090/update/xdata_v3?name="xdata_v4"

	:param app_id: Application name
	:return: Boolean response message as JSON blob
	"""
	return Brew.update (app_id)

@app.route ('/delete/<app_id>', methods=['DELETE'])
def delete (app_id):
	"""
	Deletes an application permentantly from Distill

	.. code-block:: bash

		$ curl -XDELETE https://localhost:8090/xdata_v3
	
	:param app_id: Application name
	:return: Boolean response message as JSON blob
	"""
	return Brew.delete (app_id)

@app.route ('/search/<app_id>', defaults={"app_type" : None}, methods=['GET'])
@app.route ('/search/<app_id>/<app_type>', methods=['GET'])
def segment (app_id, app_type):
	"""
	Search against an application on various fields.

	.. code-block:: bash

		$ curl -XGET https://[hostname]:[port]/search/xdata_v3?q=session_id:A1234&size=100&scroll=false&fl=param1,param2

	:param app_id: Application name
	:param app_type: Optional document type to filter against
	:param q: Main search query. To return all documents, pass in q=*:*
	:param size: Maximum number of documents to return in request
	:param scroll: Scroll id if the number of documents exceeds 10,000
	:param fl: List of fields to restrict the result set
	:return: JSON blob of result set
	""" 
	q = request.args
	return UserAle.segment (app_id, app_type=app_type, params=q)

@app.route ('/stat/<app_id>', defaults={"app_type" : None}, methods=['GET'])
@app.route ('/stat/<app_id>/<app_type>', methods=['GET'])
def stat (app_id, app_type):
	"""
	Generic histogram counts for a single registered application filtered optionally by document type.
	View the Statistics document page for method definitions and arguments

	.. code-block:: bash

		$ curl -XGET https://localhost:8090/stat/xdata_v3/testing/?stat=terms&elem=signup&event=click

	:param app_id: Application name
	:param app_type: Application type
	:return: JSON blob of result set
	"""
	stat = request.args.get ('stat')
	q = request.args

	hist_cls = Hist ()
	method = None
	try:
		method = getattr (hist_cls, stat)
		return method (app_id, app_type, q=q)
	except AttributeError:
		msg = "Class `{}` does not implement `{}`".format(hist_cls.__class__.__name__, stat)
		return jsonify (error=msg)

@app.route ('/denoise/<app_id>', methods=['GET'])
def denoise (app_id):
	"""
	Bootstrap script to cleanup the raw logs. A document type called "parsed"
	will be stored with new log created unless specified in the request. Have option to save 
	parsed results back to data store. These parsed logs can be intergrated with STOUT results 
	by running the stout bootstrap script.

	.. code-block:: bash
	
		$ curl -XGET https://localhost:8090/denoise/xdata_v3?save=true&type=parsed

	:param app_id: Application name
	:return: [dict] 
	"""
	doc_type = 'parsed'
	save = False
	q = request.args
	if 'save' in q:
		save = str2bool (q.get ('save'))
	if 'type' in q:
		# @TODO: Proper cleanup script needs to happen
		doc_type = q.get ('type')
	return UserAle.denoise (app_id, doc_type=doc_type, save=save)

@app.route ('/stout', methods=['GET'])
def merge_stout ():
	"""
	Bootstrap script to aggregate user ale logs to stout master answer table
	This will save the merged results back to ES instance at new index stout
	OR denoise data first, then merge with the stout index...
	If STOUT is enabled, the select method expects a stout index to exist or otherwise 
	it will return an error message. 

	.. code-block:: bash

		$ curl -XGET https://locahost:8090/stout/xdata_v3

	:return: Status message
	"""
	flag = app.config ['ENABLE_STOUT']
	if flag:
		return Stout.ingest ()
	return jsonify (status="STOUT is disabled.")

@app.errorhandler(404)
def page_not_found (error):
	"""
	Generic Error Message
	"""
	return "Unable to find Distill." 
