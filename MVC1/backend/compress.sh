#!/bin/bash

combined="combined.txt"
> $combined # Clear the combined file if it exists

# Loop through .ts, .css, .js, and .html files recursively, excluding node_modules directory
find . -type f \( -name "*.ts" -or -name "*.css" -or -name "*.js" -or -name "*.html" \) ! -path "*/node_modules/*" -print0 | while IFS= read -r -d $'\0' file; do
    echo -e "\n\n\n/*** $file ***/" >> $combined
    cat "$file" >> $combined
done
