# -*- coding: utf-8 -*-
from __future__ import division
import os, time
import threading
import time
import sys, getopt
import math
import json

from SocketServer import TCPServer, BaseRequestHandler
import traceback
import threading

rlock = threading.RLock()
curPosition = 0
totalBlks = 0

FILE = 0
DISK = 1
RESPONSE = {}


class MyBaseRequestHandlerr(BaseRequestHandler):
    """
    #从BaseRequestHandler继承，并重写handle方法
    """

    def handle(self):
        # 循环监听（读取）来自客户端的数据
        # while True:
        # 当客户端主动断开连接时，self.recv(1024)会抛出异常
        try:

            # 一次读取1024字节,并去除两端的空白字符(包括空格,TAB,\r,\n)
            data = self.request.recv(1024).strip()

            # print data
            if data == 'status':
                self.request.sendall(json.dumps(RESPONSE))
                # print "%s"% json.dumps(RESPONSE)

                # self.client_address是客户端的连接(host, port)的元组

                # 转换成大写后写回(发生到)客户端

        except:
            traceback.print_exc()
            # break


class WriterDisk(threading.Thread):
    def __init__(self, data, p, res):
        self.datalist = data
        self.path = p
        self.res = res
        # self.setDaemon(True)
        super(WriterDisk, self).__init__()

    def run(self):
        while True:
            try:
                rlock.acquire()
                ds = self.datalist.pop()
                rlock.release()
                data = ds[0]
                num = ds[1]
                if num == -1: break;
                # print "The %s block of data is processing.."%num
                f = open(os.path.join(self.path, "%s.dd" % num), 'wb')
                # print "data size:%s"%len(self.data)
                f.write(data)
                f.flush()
                f.close()
                rlock.acquire()
                self.res.did()
                rlock.release()
                # print "The %s block of data done" % num
            except IndexError:
                rlock.release()
                #  print "Waitting for data.--%s"%self.path
                # time.sleep(5)

                # finally:
                # rlock.release()
                # time.sleep(5)
                # self.join()


class Resource(object):
    def __init__(self, totalBlock, blockSize):
        self.totalBlock = totalBlock
        # 分块大小
        self.blockSize = blockSize
        self.curBlock = 0
        self.starttime = time.time()
        # self.f=open("/tmp/p",'w')
        # self.f.write("0,0")
        self.lt = time.time()
        # f.close()

    # 计算文件大小
    def getProcess(self):
        # print self.curBlock // self.totalBlock

        tc = (time.time() - self.starttime)
        return [self.curBlock / self.totalBlock * 100, int(self.curBlock * self.blockSize / tc / 1024 / 1024)]

    def did(self):
        # print "one more"
        # print self.curBlock,self.totalBlock
        if self.curBlock <= self.totalBlock:
            self.curBlock += 1;

            # f=open("/tmp/p",'wb')
            if self.lt + 1 < time.time():
                tc = (time.time() - self.starttime)
                RESPONSE['process'] = (self.curBlock / self.totalBlock) * 100
                RESPONSE['speed'] = int(self.curBlock * self.blockSize / tc / 1024 / 1024)
                self.lt = time.time()


def test2(source, targets=[], blocksize=8, sourcesize=0, srctype=FILE, hash=False, targetdetail=[]):
    if sourcesize != 0 and srctype == FILE: return False
    # print source,targets,blocksize,sourcesize,srctype,hash
    starttime = time.time()
    # 文件
    # fileName=source
    if os.path.exists(source):
        fileName = source
    else:
        # print "SourceFile not found."
        return False
    # path = ['d:', 'e:','g:','i:']
    # path=['/Volumes/extData',u'/Volumes/新加卷','/Volumes/TOSHIBA']
    path = []
    for item in targets:
        if not os.path.exists(item):
            # print "Path not found."
            return False
        path.append(item)

    server = TCPServer(("127.0.0.1", 9999), MyBaseRequestHandlerr)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.setDaemon(True)
    server_thread.start()

    f = open(fileName, 'rb')
    bs = int(blocksize) * 1024 * 1024
    fs = 0
    if srctype == FILE:
        f.seek(0, os.SEEK_END)
        fs = f.tell()
    elif srctype == DISK:
        fs = int(sourcesize)
    # print "Source Size is : %sMB"%(fs/1024/1024)

    bc = math.ceil(fs / bs)
    # totalBlks=bc
    # print bc
    res = Resource(bc, bs)
    rc = 0
    datas = []
    threads = []
    f.seek(0)
    for p in path:
        rdr = WriterDisk(datas, p, res)
        threads.append(rdr)
        # rdr.setDaemon(True)
        rdr.start()
    # print ""
    run = True
    # print "Now is :%s"%time.clock()
    while True:
        if rc == bc:
            rlock.acquire()
            for i in range(len(path)):
                datas.insert(0, ['', -1])
            # datas.insert(0,['', -1])
            rlock.release()
            while True:

                if len(threads) == 0:
                    break
                else:
                    for t in threads:
                        if not t.is_alive():
                            threads.pop(threads.index(t))
            break
        else:
            if len(datas) <= 16:

                rlock.acquire()

                datas.append([f.read(bs), rc])
                rc += 1
                rlock.release()
            else:
                time.sleep(0.4 * len(threads))

    while True:
        if len(threads) == 0: break
    return True


class DiskCopy:
    def __init__(self, source):
        self.source = source

    def copy(self):
        result = {}
        try:
            if(source):
                config = json.loads(self.source)
                src = config['sourceDisk']
                srcPath = config['sourceDisk']['logicalName']
                srcSize = config['sourceDisk']['size']['value']
                ##sn
                srcSN = config['sourceDisk']['serial']
                # product
                srcProduct = config['sourceDisk']['product']
                dst = config['targetFolder']
                isHash = config['isHash']
                blockSize = config['blockSize']
                # 需要克隆到的目标USB详细信息包括{"name":"/media/devbwh/EEA130005F48",
                # "capacity":1410316,"serial":"5468-6efe","procut":"xxx"}
                # capacity:当前usb剩余空间
                targetCapacityArr = config['targetCapacityArr']
                if test2(srcPath, dst, blockSize, srcSize, srctype=DISK, hash=isHash, targetdetail=targetCapacityArr):
                    result['status'] = "success"
                else:
                    result['status'] = "error"
        except Exception, e:
            result['status'] = "error:" + str(e)
        return json.dumps(result)


if __name__ == '__main__':
    # if not os.path.exists("/tmp/8fish.lock"):
    if len(sys.argv) <= 1:
        print 'error'
        sys.exit(0)
        # os.system('echo 1>/tmp/8fish.lock')
    source = sys.argv[1]
    # f=open('/tmp/result','w')
    # f.write("begin:%s"%time.time())
    # f.flush()
    c = DiskCopy(source)
    r = c.copy()
    print r
    # f.write("end:%s"%time.time())
    # f.close()
    # os.system('rm /tmp/8fish.lock')
