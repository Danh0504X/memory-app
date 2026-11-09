import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// react-native-svg-transformer bỏ qua thẻ có tiền tố namespace (vd. "<ns0:path>" do công cụ Python sinh ra):
// trình duyệt vẫn vẽ nên bản web không lộ lỗi, còn app thì hình trống trơn.
const svgFiles = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? svgFiles(join(dir, entry.name)) : entry.name.endsWith('.svg') ? [join(dir, entry.name)] : [],
    );

test('mọi SVG trong src/assets dùng thẻ không có tiền tố namespace', () => {
    const broken = svgFiles('src/assets').filter((file) => /<\/?[A-Za-z][\w-]*:[A-Za-z]/.test(readFileSync(file, 'utf8')));
    assert.deepEqual(broken, []);
});
