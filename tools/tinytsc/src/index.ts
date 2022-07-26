#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { doBuild, doCopy } from './compiler';

program.parse(process.argv);

let og: string = path.resolve(process.cwd());

doBuild(og);
doCopy(og);