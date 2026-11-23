import test from 'node:test';
import assert from 'node:assert/strict';
import {findAmbiguousHex,validateHexLiterals} from '../tools/validate-hex-literals.mjs';

test('hex guard catches signed-Integer inference, including casts and padded literals',()=>{
 const source='Dim machine As Long = &H8664\r\nIf (flags And &HF041) <> 0 Then Exit Sub\r\nChrW$(CLng(&HFEFF))\r\nx = &H00008000';
 const result=findAmbiguousHex(source,'fixture.twin');
 assert.deepEqual(result.map(d=>[d.line,d.literal]),[[1,'&H8664'],[2,'&HF041'],[3,'&HFEFF'],[4,'&H00008000']]);
 assert.equal(result[0].column,23);
 assert.match(result[0].message,/&H8664&/);
});

test('hex guard distinguishes explicit widths and unsigned ranges from strings/comments',()=>{
 const source=[
  'x = &H7FFF: y = &H10000: z = &H800B0100',
  'x = &H8000&: y = &HFFFF&: guid.data2 = &HCD44%',
  'x = "&H8664 and ""&HF041""": y = &H8664&',
  "' &HFEFF",'Rem &HF000','x = 1: Rem &HA000',
  'Remember = &HA000',
 ].join('\n');
 assert.deepEqual(findAmbiguousHex(source).map(d=>[d.line,d.literal]),[[7,'&HA000']]);
});

test('active first-party canonical projects and mirrors contain no ambiguous high-bit hex literals',()=>{
 const result=validateHexLiterals();
 assert(result.mirrors>0&&result.packed>0);
 assert.deepEqual(result.diagnostics,[]);
});