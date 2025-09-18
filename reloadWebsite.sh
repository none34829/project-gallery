#!/bin/bash

# Navigate to the dist directory
cd dist/ || { echo "Directory dist/ not found. Exiting."; exit 1; }

# Load NVM and use Node version 16.1.0
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
else
    echo "NVM not found. Exiting."
    exit 1
fi

nvm use 16.1.0

# Run the npm production build
npm run prod-hydrate

# Commit and push the changes
git commit --allow-empty -m "adding student projects"
git push origin main