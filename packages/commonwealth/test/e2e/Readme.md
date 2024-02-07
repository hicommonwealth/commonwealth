The subFolders in this directory are used for specific purposes:

* e2eStateful - This relies on the DB to be set up with a dump of the test entities
* e2eSerial - The tests in this suite will be run in serial (Avoids race conditions)
* e2eRegular - The tests in this suite are set up with a default empty DB (need to make your own test entities) as well as being run in parallel.