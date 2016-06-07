# -*- coding: utf-8 -*-
import os,time
import threading
import time
import sys,getopt

rlock = threading.RLock()
curPosition = 0

FILE=0
DISK=1

class Writer(threading.Thread):
    def __init__(self,data,num,p):
        self.data=data
        self.num=num
        self.path=p
        super(Writer,self).__init__()
    def run(self):

            while len(self.path)==0:
                print "Thread %s waitting for path"%self.num
            rlock.acquire()
            path=self.path.pop()
            rlock.release()
            print "The %s block of data is processing.."%self.num
            f=open(os.path.join(path,"out","%s.dd"%self.num),'wb')
            # print "data size:%s"%len(self.data)
            f.write(self.data)
            f.flush()
            f.close()
            rlock.acquire()
            path=self.path.append(path)
            rlock.release()
            print "The %s block of data done" % self.num

        # self.join()

class WriterDisk(threading.Thread):
    def __init__(self,data,p):
        self.datalist=data
        self.path=p
        # self.setDaemon(True)
        super(WriterDisk,self).__init__()
    def run(self):
            while True:
                try:
                    rlock.acquire()
                    ds=self.datalist.pop()

                    rlock.release()
                    data=ds[0]
                    num=ds[1]
                    if num==-1:break;
                    # print "The %s block of data is processing.."%num
                    f=open(os.path.join(self.path,"%s.dd"%num),'wb')
                    # print "data size:%s"%len(self.data)
                    f.write(data)
                    f.flush()
                    f.close()
                    # print "The %s block of data done" % num
                except IndexError:
                   rlock.release()
                   #  print "Waitting for data.--%s"%self.path
                    # time.sleep(5)

                # finally:
                    # rlock.release()
                    # time.sleep(5)
        # self.join()


class Reader(threading.Thread):
    def __init__(self, res):
        self.res = res
        super(Reader, self).__init__()
    def run(self):
        global curPosition
        fstream = open(self.res.fileName, 'r')
        while True:
            #锁定共享资源
            rlock.acquire()
            startPosition = curPosition
            curPosition = endPosition = (startPosition + self.res.blockSize) if (startPosition + self.res.blockSize) < self.res.fileSize else self.res.fileSize
            #释放共享资源
            rlock.release()
            if startPosition == self.res.fileSize:
                break
            elif startPosition != 0:
                fstream.seek(startPosition)
                fstream.readline()
            pos = fstream.tell()
            while pos < endPosition:
                line = fstream.readline()
                #处理line
                #print(line.strip())
                pos = fstream.tell()
                print pos
        fstream.close()

class Resource(object):
    def __init__(self, fileName):
        self.fileName = fileName
        #分块大小
        self.blockSize = 8*1024*1024
        self.getFileSize()
    #计算文件大小
    def getFileSize(self):
        fstream = open(self.fileName, 'r')
        fstream.seek(0, os.SEEK_END)
        self.fileSize = fstream.tell()
        fstream.close()

def test2(source,targets=[],blocksize=8,sourcesize=0,type=FILE,hash=False):

    if sourcesize!=0 and type==FILE:return False
    starttime = time.clock()
    # 文件
    fileName=source
    if os.path.exists(source):
        fileName=source
    else:
        print "SourceFile not found."
        return False
    # path = ['d:', 'e:','g:','i:']
    # path=['/Volumes/extData',u'/Volumes/新加卷','/Volumes/TOSHIBA']
    path=[]
    for item in targets:
        if not os.path.exists(item):
            print "Path not found."
            return False
        path.append(item)
    f = open(fileName, 'rb')
    bs = int(blocksize)* 1024*1024
    fs=0
    if type==FILE:
        f.seek(0, os.SEEK_END)
        fs = f.tell()
    elif type==DISK:
        fs=int(sourcesize)
    print "Source Size is : %sMB"%(fs/1024/1024)
    bc = fs / bs
    # print bc
    rc = 0
    datas = []
    threads = []
    f.seek(0)
    for p in path:
        rdr = WriterDisk(datas, p)
        threads.append(rdr)
        # rdr.setDaemon(True)
        rdr.start()
    # print ""
    run=True
    print "Now is :%s"%time.clock()
    while True:
        if rc == bc :
            rlock.acquire()
            for i in range(len(path)):
                datas.insert(0,['',-1])
            # datas.insert(0,['', -1])
            rlock.release()
            while True:
                # print "There are %s threads"%len(threads)
                if len(threads) == 0:
                    break
                else:
                    for t in threads:
                        if not t.is_alive():
                            print t
                            threads.pop(threads.index(t))
            break
        else:
         if len(datas)<=8:
            rlock.acquire()
            datas.append([f.read(bs),rc])
            rc += 1
            rlock.release()

    while True:
        if len(threads) == 0: break
    tc=(time.clock() - starttime)
    print "Now is :%s"%time.clock()
    # print (time.clock() - starttime)
    print "%s files been created. Using %s Seconds"%(bc,tc)
    print "Speed is:%sMB/s"%int((fs/1024/1024)/tc)
    return True


if __name__ == '__main__':
    opts, args = getopt.getopt(sys.argv[1:], "hi:s:b:t:c:1:2:3:4:")
    input_file=""
    path=[]
    size=0
    bs=8
    stype=FILE
    hash=False
    for op, value in opts:
        if op == "-i":
            input_file = value
        elif op == "-1":
            path.append(value)
        elif op == "-2":
            path.append(value)
        elif op == "-3":
            path.append(value)
        elif op == "-4":
            path.append(value)
        elif op == "-b":
            bs=value
        elif op == "-s":
            size=value
        elif op == "-t":
            stype=value
        elif op == "-c":
            hash=value
        elif op == "-h":
            print u"Dumper用于多线程硬盘复制:\n参数:\n-i:输入文件或者磁盘路径及文件名\n" \
                  u"-1~-4:输出路径\n-b:每次读取块大小,单位:bytes\n-s:文件大小,单位:bytes\n-c:是否计算Hash"
            sys.exit()
    if len(opts)<>0:
        print "Dumping %s to %s"%(input_file,path)
        if test2(input_file,path,int(bs),int(size),int(stype),False):
            print "App Finished."
        else:
            print "App Error."
    else:
        print u"请输入python dumper.py -h获取帮助."



#
# def getProcess():
#     test2(src,dst,bs,sor,)