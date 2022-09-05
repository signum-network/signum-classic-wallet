#!/bin/bash

set -e

echo "🛰 Updating Signum Phoenix Wallet to current release..."

PHOENIX_DIR=./html/ui/phoenix/
if [[ ! -e $PHOENIX_DIR ]]; then
  echo "Cannot find $PHOENIX_DIR"
  echo "🚫 Please run this script in your signum-node root dir (aside signum-node executable)"
  exit -1
fi

# prepare tmp folder
TMPDIR=./tmp
if [[ -e $TMPDIR ]]; then
        rm -rf $TMPDIR
fi
mkdir $TMPDIR
pushd $TMPDIR > /dev/null

echo "⬇️  Downloading latest release..."

# Download the latest phoenix release
curl -s "https://api.github.com/repos/signum-network/phoenix/releases/latest" \
    | grep "web-phoenix-signum-wallet.*.zip" \
    | cut -d : -f 2,3 \
    | tr -d \" \
    | grep "https" \
    | wget -qi -

echo "📦 Extracting files..."
# Unzip it
unzip -qq web-phoenix-signum-wallet.*.zip

echo "🏗  Patching base href..."

# Modify the base href in the index file
sed -i 's;<base href="/">;<base href="/phoenix/">;g' dist/index.html

echo "📝 Copying Phoenix Wallet to node..."

rm -rf ../$PHOENIX_DIR/*
cp -R dist/* ../$PHOENIX_DIR

echo "🛀 Cleaning up..."
# Go back to original directory
popd > /dev/null

rm -rf $TMPDIR

echo "✅ Phoenix Wallet has been updated."
