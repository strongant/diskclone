# _*_ coding: UTF-8 _*_
import json
from dumper import *


class DiskCopy:
    def __init__(self, source):
        self.source = source

    def copy(self):
        result = {}
        try:
            ##sn
            #product
            #目标盘剩余空间大小
            #
            config = json.loads(self.source)
            src = config['sourceDisk']
            srcPath = config['sourceDisk']['logicalName']
            srcSize = config['sourceDisk']['size']['value']
            dst = config['targetFolder']
            isHash = config['isHash']
            blockSize = config['blockSize']
            #需要克隆到的目标USB详细信息包括{"name":"/media/devbwh/EEA130005F48",
            #"capacity":1410316,"serial":"5468-6efe","procut":"xxx"}
            targetCapacityArr = config['targetCapacityArr']

            if test2(srcPath, dst, blockSize, srcSize, srctype=DISK, hash=isHash,targetdetail=targetCapacityArr):
                result['status'] = "success"
            else:
                result['status'] = "error"
        except Exception, e:
            result['status'] = "error:"+str(e)
        return json.dumps(result)


if __name__ == '__main__':
    if len(sys.argv) <= 1:
        print 'error'
        sys.exit(0)
    source = sys.argv[1]
    c = DiskCopy(source)
    r = c.copy()
    print r
