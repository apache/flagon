FROM logstash:5
MAINTAINER Michelle Beard <msbeard@apache.org>

# Get GeoIP DB
RUN set -x \
       && wget http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz \
       && gunzip GeoIP.dat.gz \
       && mkdir -p /usr/share/logstash/GeoIP \
       && mv GeoIP.dat /usr/share/logstash/GeoIP/GeoIP.dat

RUN mkdir /usr/share/logstash/templates