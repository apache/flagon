FROM phusion/passenger-full
LABEL org.opencontainers.image.authors="poorejc@apache.org"

RUN bash -lc 'rvm --default use ruby-3.2.3'

# Cache bundle
COPY Gemfile* /tmp/
WORKDIR /tmp
RUN bundle install

ENV app /app

# Install npm modules
COPY package.json /tmp/
WORKDIR /tmp
RUN npm install -g

# Add src code
RUN mkdir $app
WORKDIR $app
ADD . $app

# Jekyll buld
RUN bundle exec jekyll build

WORKDIR $app/_site

EXPOSE 8000