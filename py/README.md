## install
developed and tested with **python @3.6.5**

creat a python virtual enviroment
```bash
python3 -m venv myenv  
source myenv/bin/activate
```

then
```bash
pip install -r requirements.txt
```
then install pycausal
```bash
pip install git+git://github.com/bd2kccd/py-causal
```

**Note**: you may fail to install javabridge when run `pip install -r requirements.txt`, here is my solution:  
```bash
export CFLAGS="-I path_to_myenv/lib/python3.6/site-packages/numpy/core/include  $CFLAGS"  
pip install javabridge
```

## run
```bash
python server.py --port 7777
```

