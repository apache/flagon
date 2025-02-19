from elasticsearch_dsl import connections
from elasticsearch_dsl import Search
from elasticsearch_dsl import Q
import os

flagonClient = connections.create_connection('flagonTest', hosts=['https://localhost:9200'], basic_auth=("elastic", os.environ['ES_PASSWORD']), verify_certs=False)
AleS = Search(using='flagonTest', index="userale")
qLogType = Q("match", logType="raw") | Q("match", logType="custom")

elk_search = AleS \
    .query(qLogType) \
    .extra(track_total_hits=True) #breaks return limit of 10000 hits

elk_response = elk_search.scan()
for hit in elk_response:
    print(hit)