How to run the project

On windows:

from root directory of the project run the following commands:
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
after that, open a new terminal and run the folowing commands:
```
cd frontend
npm install
npm start
```
On unix/mac:

from root directory of the project run the following commands:
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
after that, open a new terminal and run the folowing commands:
```
cd frontend
npm install
npm start
```
