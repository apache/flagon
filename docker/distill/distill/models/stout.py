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

from distill import app, es
from elasticsearch_dsl import DocType, String, Boolean, Date, Nested, Search
from elasticsearch_dsl.query import MultiMatch, Match, Q
from elasticsearch import Elasticsearch, TransportError
from flask import jsonify
import pandas as pd 

class StoutDoc (DocType):
    """
    Representation of a Stout documentat.
    """

    sessionID = String (index="not_analyzed")
    task1 = Nested ()
    task2 = Nested ()

    class Meta:
        index = '.stout'
        doc_type = 'testing'

    def save (self, *args, **kwargs):
        """
        Save data from parsing as a Stout document in Distill
        """
        return super (StoutDoc, self).save (*args, **kwargs)

class Stout (object):
    """
    Main Stout class to support ingest and search operations.
    """

    @staticmethod
    def ingest (): 
        """
        Ingest data coming from Stout to Distill
        """

        # Create the mappings in elasticsearch
        StoutDoc.init ()
        status = True
        data = _parse ();           
        try:
            for k,v in data.items ():
                doc = StoutDoc ()
                if 'sessionID' in v:
                    doc.sessionID = v['sessionID']
                if 'task1' in v:
                    doc.task1 = v['task1']
                if 'task2' in v:
                    doc.task2 = v['task2']
                doc.save () 
        except Error as e:
            status = False
        return jsonify (status=status)

def _parse ():
    """
    Parse master answer table with mapping into an associative array

    :return: [dict] dictionary of session information
    """
    master = app.config ['MASTER']
    mappings = app.config ['MAPPINGS']

    fileContents=pd.read_csv(master, encoding='utf-8')
    plainTextMappings=pd.read_csv(mappings, encoding='raw_unicode_escape')
    headers=list(fileContents.columns.values)
    
    #generate the mapping between header and plain text
    translationRow={};
    for fieldIndex in range(1,len(headers)):
        t=plainTextMappings.ix[fieldIndex]
        translationRow[headers[fieldIndex]]=t[9]
         
    dictBySessionID={}
    translationRow['items.text']='foo'    
    index=0
    for row in fileContents.iterrows():
        index=index+1
        
        taskMetrics={}
        index,data=row
        identifier=row[1][0].split("::")
        sessionID=identifier[0]
        taskID=(identifier[1])
        workingData={}
        #is this session id already in the dictionary?
        if sessionID in dictBySessionID:
            #grab the entry as workingData
            workingData=dictBySessionID[sessionID]
 
        sysData={}
        task1Data={}
        task2Data={}
        metaData={}
        d={}

        for fieldIndex in range(1,len(headers)):
            if not pd.isnull(row[1][fieldIndex]):  #only interested in non-null fields
                tempDict={}
                if headers[fieldIndex] in translationRow:
                    tempDict['field']=translationRow[headers[fieldIndex]]
                    #tempDict['field']=translationRow[9]
                tempDict['value']=row[1][fieldIndex]
                d[headers[fieldIndex]]=row[1][fieldIndex]
                if "SYS" in headers[fieldIndex]:
                    sysData[headers[fieldIndex]]=tempDict
                elif "OT1" in headers[fieldIndex]:
                    task1Data[headers[fieldIndex]]=tempDict
                elif "OT2" in headers[fieldIndex]:
                    task2Data[headers[fieldIndex]]=tempDict
                else:
                    metaData[headers[fieldIndex]]=tempDict
         
        if d['TSK_TIME_DIFF_']>0:  #block tasks with zero time elapsed
            a=int(d['TSK_TIME_DIFF_OT1_'])
            b=int(d['TSK_TIME_DIFF_OT2_'])
            #figure out which task the values belong to
            if ((a>0) & (b<=0)):
                task1Data['taskID']=taskID
                task1Data['meta']=metaData
                task1Data['system']=sysData
                workingData['task1']=task1Data
            elif ((a<=0) & (b>0)):
                task2Data['taskID']=taskID
                task2Data['meta']=metaData
                task2Data['system']=sysData
                workingData['task2']=task2Data
            else:
                raise ValueError('Encountered an unexpected task time diff state')

        workingData['sessionID'] = sessionID   
        dictBySessionID[sessionID]=workingData    
    return dictBySessionID
