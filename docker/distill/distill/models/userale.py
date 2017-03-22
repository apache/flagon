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
from elasticsearch_dsl import DocType, String, Boolean, Date, Float, Search
from elasticsearch_dsl.query import MultiMatch, Match, Q
from elasticsearch import Elasticsearch, TransportError
from elasticsearch_dsl.connections import connections
from werkzeug.datastructures import ImmutableMultiDict, MultiDict

from flask import jsonify, Markup
from distill import app, es
import datetime

class UserAle (object):
	"""
	Main method of entry to perform segmentation and integration of STOUT's master
	answer table (if STOUT is enabled). Advanced and basic analytics is performed in the
	distill.algorithms.stats and distill.algorithms.graphs module.
	"""

	@staticmethod
	def segment (app, app_type=None, params=''):
		"""
		Just support match all for now. 
		"""
		q = params.get ("q") if params.get ("q") else {}
		fields = params.get ("fields") if params.get ("fields") else []
		size = params.get ("size") if params.get ("size") else 10
		scroll = params.get ("scroll") if params.get ("scroll") else False
		fl = params.get ("fl") if params.get ("fl") else []

		# filters = params.get ("filter") if params.get ("filter") else {}
		
		# 'q': args.get('q', '{}'),
		# 'fields': args.get('fl', '{}'),
		# 'size': args.get ('size', 100),
		# 'scroll': args.get ('scroll', False),
		# 'filters': request_args.getlist ('fq')
		query = {}
		query ['size'] = size
		
		if q:
			res = q.split(":")
			key = res [0]
			val = res [1]
			query ['query'] = {"match" : { key : val } }
		else:
			query ['query'] = {"match_all" : {}}

		if len (fields) > 0:
			ex = {
					"include" : fields.split(",")
				}
			query ['_source'] = ex


		response = es.search (index=app, doc_type=app_type, body=query)

		return jsonify (response)

	@staticmethod
	def search (app,
				app_type=None,
				filters=list (),
				size=100,
				include="*",
				scroll=None,
				sort_field=None):
		""" 
		Perform a search query.

		:param app: [string] application id (e.g. "xdata_v3")
		:param app_type: [string] name of the application type. If None all application types are searched.
		:param filters: [list of strings] list of filters for a query. 
		:param size: [int] maximum number of hits that should be returned
		:param sort_field: [string] sorting field. Currently supported fields: "timestamp", "date"
		:return: [dict] dictionary with processed results. If STOUT is enabled, STOUT data will be merged with final result.
		"""

		# Need some query builder...
		log_result = es.search (index=app, doc_type=app_type, body=query, fields=filters, size=size)

		stout_result = Stout.getSessions ()

		data = merged_results (log_result, stout_result)
		return data

	@staticmethod
	def denoise (app, app_type='parsed', save=False):
		"""
		"""
		pass

"""
Combine a list of dictionaries together to form one complete dictionary
"""
def merge_dicts (lst):
	dall = {}
	for d in lst:
		dall.update (d)
	return dall

"""
Get query parameters from the request and preprocess them.
:param [dict-like structure] Any structure supporting get calls
:result [dict] Parsed parameters
"""
def parse_query_parameters (indx, app_type=None, request_args = {}):
	args = {key: value[0] for (key, value) in dict (request_args).iteritems ()}

	# print "args = ", args
	# Parse out simple filter queries
	filters = []
	for filter in get_all_fields (indx, app_type):
		if filter in args:
			filters.append((filter, args[filter]))
	
	return {
		'q': args.get('q', '{}'),
		'fields': args.get('fl', []),
		'size': args.get ('size', 100),
		'scroll': args.get ('scroll', False),
		'filters': request_args.getlist ('fq')
	}