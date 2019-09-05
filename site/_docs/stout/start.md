---
title: Getting Started
component: stout
priority: 1
---
#### This project is not currently maintained and will be refactored. If you are interested in STOUT, join the discussion on our [dev list](mailto:dev-subscribe@flagon.incubator.apache.org).

### Getting Going...
If you already have your own system and just want to work with the source code, then skip to the next section.  Otherwise read on...

The simplest way to get started, rather than build your own system from the ground up, is to download both [VirtualBox](https://www.virtualbox.org) and [Vagrant](https://www.vagrantup.com).  Once you have both of those working, you can clone this repository to begin.

#### Getting this working on Vagrant (VirtualBox)

Get a base centos box (this may take awhile)

  ```bash
  vagrant box add centos_6.5 https://github.com/2creatives/vagrant-centos/
  releases/download/v6.5.3/centos65-x86_64-20140116.box
  ```

Start it

  ```bash
  vagrant up virtualbox
  ```

#### Getting this working on Vagrant (OpenStack)

Get a base centos box (this may take awhile)

You need 2 files:

1. The first is the `.pem` (or `.cer`) file which is the KeyPair file you can download from the OpenStack dashboard.

2. The second is a shell script which contains all the environment variables referenced in the Vagrantfile.  This is located under API Access under the Security Settings.  Once you download this file run `source $file.sh`, and this will ask you for you OpenStack password and load all the required varaibles under your current environment.  

Adjust the Vagrantfile to use the appropriate `.pem` file and the appropriate KeyPair name associated with that pem file.  Once that is complete you can run:

  ```bash
  vagrant up openstack --provider=openstack
  ```

---------------
### If you already have your own system...

Once this package is cloned, create the database

  ```bash
  python manage.py syncdb
  ```

This will also create a superuser.


#### During development, if you want to drop to the database and start over run the following:

  ```bash
  python manage.py sqlclear op_tasks | python manage.py dbshell
  python manage.py syncdb
  python manage.py populate_db
  ```

This will keep your super user and drop just the app database which is a lot nicer than deleting the whole database and starting over

This process is also under the `reset_optask` command

  ```bash
  python manage.py reset_optask
  ```

--------------------------------
### Now that STOUT is running...
The following instructions assume you're using Vagrant.  If you're using another system, you might need to alter them slightly (e.g. different IP addresses, etc.) to get the same results.

#### Test operation
Open a browser and point it to [localhost:8080](http://localhost:8080).  You should see the welcome page for the XDATA Online Experiment. The system comes with a one prepopulated example task.  Register a new user and test it out.

#### Access admin page
The Admin page allows direct access to the STOUT database.  From this page you can manage users, tasks, and products directly. Before you can access the admin page, you need to create a superuser.  If you're using Vagrant you can ssh into that system using

  ```bash
  vagrant ssh virtualbox
  ```

Navigate to the source directory and add a superuser

  ```bash
  cd /var/www/op_tasks/db/
  sudo python manage.py createsuperuser
  ```

Now point your browser to the admin page at [localhost:8080/admin](http://localhost:8080/admin) to begin browsing the STOUT database.

#### Add subjects
From the admin page, you can pre-register users through the Participants link.
#### Add tasks
You can also add new tasks for users to complete through the Op tasks link.  First however you must add a dataset for the task to reference.  That can be done through the Datasets link.
#### Add products
New products can be added through the product link.  Products are tools available online.  Copy and past the address for the tool into the URL field and then fill in the remaining information.
#### Assign task sequences
Normally, a user is assigned a random order of tasks from all those that are available.  If you'd prefer to assign a sequence of tasks though that can be managed through the TaskListItem link.  

**Note:** If you assign multiple tasks to a single user, only mark the first task as ***Ot active*** and leave all checkboxes for the remaining tasks empty
