#!/bin/sh
env=${1:-user}
node_modules/.bin/knex migrate:latest --env $env
node_modules/.bin/knex seed:run --env $env 
