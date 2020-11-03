#!/bin/bash
export NODE_ENV=test

if [ ${GITHUB_ACTIONS} ]; then
  DOCKER_COMPOSE_CMD="echo skip docker-compose"
else
  DOCKER_COMPOSE_CMD="docker-compose"
fi

${DOCKER_COMPOSE_CMD} down || exit 1
${DOCKER_COMPOSE_CMD} up -d || exit 1
sleep 5

if npm run test; then
  echo "Test Success"
  ${DOCKER_COMPOSE_CMD} down
else
  echo "Test Failed"
  ${DOCKER_COMPOSE_CMD} down
  exit 1
fi
