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

from distill import es
from distill.utils.query_builder import QueryBuilder
from flask import jsonify
from elasticsearch import Elasticsearch, TransportError

class Hist (object):
	"""
	Distill's statistics package. Apply statistical algorithms to User Ale log data segmented with
	Stout. Need to query/filter by session or user id.
	"""

	def __init__ (self):
		# parse out query 
		pass

 	# @staticmethod
 	# def filter (app, app_type=None, q=''):

		# field = q.get ("field") if q.get ("field") else ""
		# size = q.get ("size") if q.get ("size") else 10

		# query = { "aggs" : {
		# 			"count_by_type" : {
		# 				"filter" : { "term" : { field : }}
		# 				"terms" : {
		# 					"field" : field,
		# 					"size" : 100
		# 				}
		# 			}
		# 		}
		# 	}

		# d = {}
		# # try:
		# response = es.search (index=app, doc_type=app_type, body=query)
		# # 	for tag in response['aggregations']['count_by_type']['buckets']:
		# # 		d [tag ['key']] = tag ['doc_count']
		# # except TransportError as e:
		# # 	d ['error'] = e.info			
		# # except Exception as e:
		# # 	d ['error'] = str (e)		
		# # return jsonify (d)
		# return jsonify (response)

	@staticmethod
	def terms (app, app_type=None, q=''):
		"""
		Group by field (find all elements )
		"""
		field = q.get ("field") if q.get ("field") else ""
		segment = q.get ("seg") if q.get ("seg") else "*"
		size = q.get ("size") if q.get ("size") else 10000
		numhits = q.get ("numhits") if q.get ("numhits") else 10

		query = { "aggs" : {
					"count_by_type" : {
						"terms" : {
							"field" : field,
							"size" : size	# maximum number of keys (unique fields)
						},
						"aggs" : {
							"top" : {		# arbitrary name
								"top_hits" : {
									"size" : numhits,	# number of logs in subgroup
									"_source" : {	# segment on fields - return only subgroup based on field
										"include" : [
											segment
										]
									}
								}
							}
						}
					}
				}
			}

		d = {}
		# try:
		response = es.search (index=app, doc_type=app_type, body=query)
		# 	for tag in response['aggregations']['count_by_type']['buckets']:
		# 		d [tag ['key']] = tag ['doc_count']
		# except TransportError as e:
		# 	d ['error'] = e.info			
		# except Exception as e:
		# 	d ['error'] = str (e)		
		# return jsonify (d)
		return jsonify (response)

	@staticmethod
	def unique_terms (app, app_type=None, q=""):
		"""
		Aggregate the number of unique terms in a field. Missing values are counted and marked as "N/A".

		.. todo::

			Need to incorporate QueryBuilder library instead of manually generating queries. 

		:param app: [string] application name
		:param app_type: [string] application type
		:param field: [string] field to search against for unique values
		:param size: [int] the top size terms returned in the result. Default value is 10.
		:param min_hits: [int] return tags which have been found in min_hits or more. Default value is 1.
		:return: [dict] dictionary of results
		"""
		
		field = q.get ("field") if q.get ("field") else ""
		size = q.get ("size") if q.get ("size") else 10000
		min_hits = q.get ("min_hits") if q.get ("min_hits") else 0

		print field
		query = { "aggs" : {
					"terms_agg" : {
						"terms" : {
							"field" : field,
							"size" : size,
							"min_doc_count" : min_hits,
							"missing" : "N/A"
						}
					}
				}
			}

		d = {}
		try:
			response = es.search (index=app, doc_type=app_type, body=query)
			for tag in response['aggregations']['terms_agg']['buckets']:
				d [tag ['key']] = tag ['doc_count']
		except TransportError as e:
			d ['error'] = e.info			
		except Exception as e:
			d ['error'] = str (e)		
		return jsonify (d)

	@staticmethod
	def histogram (app, app_type=None, q=""):
		"""
		Only works on numerical data.
		"""
		field = q.get ("field") if q.get ("field") else ""

		interval = 50
		query = { "aggs" : {
					"hist_agg" : {
						"histogram" : {
							"field" : field,
							"interval" : interval
						}
					}
				}
			}

		d = {}
		try:
			response = es.search (index=app, doc_type=app_type, body=query)
			for tag in response['aggregations']['hist_agg']['buckets']:
				d [tag ['key']] = tag ['doc_count']
		except TransportError as e:
			d ['error'] = e.info			
		except Exception as e:
			d ['error'] = str (e)		
		return jsonify (d)

	def get_value ():
		return 0

	def _parse_msg (query):
		# should have form ?measure=name&field=f1, f2&event=a,b
		pass
