kubectl create -f https://download.elastic.co/downloads/eck/2.11.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/2.11.0/operator.yaml
kubectl apply -f resources/logstash-auth.yaml
kubectl apply -f resources/elastic.yaml
kubectl apply -f resources/logstash.yaml
sleep 10
kubectl wait --for=condition=Ready pod/quickstart-es-default-0 --timeout=60s
kubectl wait --for=condition=Ready pod/quickstart-ls-0 --timeout=60s
kubectl port-forward service/quickstart-es-http 9200 >/dev/null 2>&1 &
kubectl port-forward service/quickstart-ls-http 8100 >/dev/null 2>&1 &
export ES_PASSWORD=$(kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode}}')