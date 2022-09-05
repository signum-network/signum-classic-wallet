#!/bin/bash

set -e

BOOT_DIR=./bootstrap
CONF_DIR=/conf # symbolic link
CONF_DEFAULT=$CONF_DIR/node-default.properties
CONF_LOGGING=$CONF_DIR/logging-default.properties
CONF_CUSTOM=$CONF_DIR/node.properties

echo "👩‍⚕Checking for configuration files..."
if [[ ! -e $CONF_DEFAULT ]]; then
  echo "🆕Creating $CONF_DEFAULT"
  cp $BOOT_DIR/node-default.properties $CONF_DEFAULT
fi

if [[ ! -e $CONF_CUSTOM ]]; then
  echo "🆕Creating $CONF_CUSTOM"
  cp $BOOT_DIR/node.properties $CONF_CUSTOM
fi

if [[ ! -e $CONF_LOGGING ]]; then
  echo "🆕Creating $CONF_LOGGING"
  cp $BOOT_DIR/logging-default.properties $CONF_LOGGING
fi

./update-phoenix.sh

echo "🚀Starting Signum Node"
exec java -XX:MaxRAMPercentage=75.0 -jar signum-node.jar --headless
