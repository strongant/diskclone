# _*_ coding: UTF-8 _*_
import json
from dumper import *


class DiskCopy:
    def __init__(self, source):
        self.source = source

    def copy(self):
        result = {}
        try:
            config = json.loads(self.source)
            print config['sourceDisk']['logicalName']
            src = config['sourceDisk']
            srcPath = config['sourceDisk']['logicalName']
            srcSize = config['sourceDisk']['size']['value']
            dst = config['targetFolder']
            isHash = config['isHash']
            blockSize = config['blockSize']
            test2(srcPath, dst, blockSize, srcSize, type=DISK, hash=isHash)
            result['status'] = "success"
        except Exception, e:
            print e
            result['status'] = "error"
        return result


if __name__ == '__main__':
    if len(sys.argv) <= 1:
        print 'error'
        sys.exit(0)
    source = sys.argv[1]
    c = DiskCopy(source)
    r = c.copy()
    print r
