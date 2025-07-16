FROM phusion/passenger-full:3.0.7
LABEL org.opencontainers.image.authors="poorejc@apache.org"

RUN bash -lc 'rvm list'
RUN bash -lc 'rvm --default use ruby-3.2.5'

# Cache bundle
COPY Gemfile* /tmp/
WORKDIR /tmp
RUN bundle install

# Install npm modules
COPY package.json /tmp/
WORKDIR /tmp
RUN npm install -g

# Add src code and build script
RUN mkdir /app
WORKDIR /app
COPY . /app

# Make the build script executable
RUN chmod +x /app/build.sh

# Run the build script
RUN /app/build.sh

WORKDIR /app/_site

EXPOSE 8000
