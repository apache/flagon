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


from elasticsearch import Elasticsearch, TransportError
from flask import jsonify
from distill import es

class Brew (object):
	""" 
	Distill supports basic CRUD operations and publishes the status
	of an persistenct database. Eventually it will support ingesting logs sent from
	an registered application.
	"""

	@staticmethod
	def get_status ():
		""" 
		Fetch the status of the underlying database instance. 

		:return: [bool] if connection to database instance has been established
		"""
		return es.ping (ignore=[400, 404])

	@staticmethod
	def get_applications ():
		""" 
		Fetch all the registered applications in Distill.
		
		.. note:: Private indexes starting with a period are not included in the result set

		:return: [dict] dictionary of all registered applications and meta information
		"""
		doc = {}
		query = { "aggs" : {
					"count_by_type" : {
						"terms" : {
							"field" : "_type",
							"size" : 100
						}
					}
				}
			}

		try:
			cluster_status = es.cat.indices (h=["index"], pri=False)
			x = cluster_status.splitlines()

			for idx in x:
			    idx = idx.rstrip ()
			    
			    # Ignore private indexes (like .kibana or .stout)
			    if idx [:1] != '.':
			        response = es.search (index=idx, body=query)
			        d = {}
			        for tag in response["aggregations"]["count_by_type"]["buckets"]:
			            d [tag ['key']] = tag ['doc_count']
			        doc [idx] = d
		except TransportError as e:
			doc ['error'] = e.info
		except Exception as e:
			doc ['error'] = str (e)
		return doc
	
	@staticmethod
	def create (app):
		"""
		Register a new application in Distill

		.. code-block:: bash

			{
				"application" : "xdata_v3",
				"health" : "green",
				"num_docs" : 0,
				"status" : "open"
			}

		:param app: [string] application name (e.g. xdata_v3)
		:return: [dict] dictionary of application and its meta information
		"""

		# ignore 400 cause by IndexAlreadyExistsException when creating an index
		res = es.indices.create (index=app, ignore=[400, 404])
		doc = _get_cluster_status (app)
		return jsonify (doc)

	@staticmethod
	def read (app, app_type=None):	
		"""
		Fetch meta data associated with an application

		.. code-block:: bash 

			Example:
			{
				"application" : "xdata_v3",
				"health" : "green",
				"num_docs" : "100",
				"status" : "open"
				"types" : {
					"raw_logs" : {
						"@timestamp" : "date",
						"action" : "string",
						"elementId" : "string"
					},
					"parsed" : {
						"@timestamp" : "date",
						"elementId_interval" : "string"
					},
					"graph" : {
						"uniqueID" : "string",
						"transition_count" : "long",
						"p_value" : "float"
					}
				}
			}

		:param app: [string] application name (e.g. xdata_v3)
		:return: [dict] dictionary of application and its meta information
		"""

		return jsonify (_get_cluster_status (app, app_type=app_type))

	@staticmethod
	def update (app):
		"""
		.. todo::
			Currently  not implemented
		"""

		return jsonify (status="not implemented")

	@staticmethod
	def delete (app):
		"""
		Technically closes the index so its content is not searchable. 

		.. code-block: bash

			Example:
			{
			  status: "Deleted index xdata_v3"
			}

		:param app: [string] application name (e.g. xdata_v3)
		:return: [dict] status message of the event
		"""

		es.indices.close (index=app, ignore=[400, 404])
		return jsonify (status="Deleted index %s" % app)

def _get_cluster_status (app, app_type=None):
	"""
	Return cluster status, index health, and document count as string

	@todo figure out how to count individual documents stored at an app_type (currently shows only index count)
	:param app: [string] application name (e.g. xdata_v3)
	:return: [dict] dictionary of index meta data including field names
	"""

	doc = {}
	try:
		cluster_status = es.cat.indices (index=app, h=["health", "status", "docs.count"], pri=True, ignore=[400, 404])
		v = str (cluster_status).split (" ")
		m = ["health", "status", "num_docs"]
		doc = dict (zip (m, v))
		# Add back application
		doc ["application"] = app
	except TransportError as e:
		doc ['error'] = e.info
	except Exception as e:
		doc ['error'] = str (e)

	doc ['fields'] = _get_all_fields (app, app_type)
	return doc

def _parse_mappings (app, app_type=None):
	"""
	.. todo: 

		Need to parse out result set that presents field list and type
	"""
	
	try:
		mappings = es.indices.get_mapping (index=app, doc_type=[app_type], ignore=[400, 404])
		# mappings = yaml.safe_load (json.ess (mappings))
		# print json.dumps (mappings [app]["mappings"], indent=4, separators=(',', ': '))
		ignore = ["properties", "format"]
	except TransportError as e:
		doc ['error'] = e.info
	except Exception as e:
		doc ['error'] = str (e)	
	return doc

def _get_all_fields (app, app_type=None):
	"""
	Retrieve all possible fields in an application

	:param app: [string] application name (e.g. xdata_v3)
	:param app_type: [string] application type (e.g. logs)
	:return: [list] list of strings representing the fields names 	
	"""
	d = list ()
	query = { "aggs" : {
				"fields" : {
					"terms" : {
						"field" : "_field_names",
						"size" : 100
					}
				}
			}
		}

	try:
		response = es.search (index=app, doc_type=app_type, body=query)
		for tag in response['aggregations']['fields']['buckets']:
			d.append (tag ['key'])
	except TransportError as e:
		d.append (str (e.info))			
	except Exception as e:
		d.append (str (e))
	return d
