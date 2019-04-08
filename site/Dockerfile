FROM starefossen/ruby-node
MAINTAINER Joshua Poore <poorejc@apache.org>

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
RUN jekyll build

WORKDIR $app/_site

EXPOSE 8000