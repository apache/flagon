---
title: Getting Started
component: useralepy
priority: 1
---

### Instrumenting Your Application Globally with Apache UserALE.PyQt5

It’s very simple to instrument a PyQt5 application with Apache UserALE.PyQt5. Simply import the Apache UserALE.PyQt5 library and register it with your application.

Below is an example PyQt5 application taken from ZetCode PyQt5 tutorial instrumented with Apache UserALE.PyQt5.

  ```python
  import sys
  from PyQt5.QtWidgets import QWidget, QLabel, QPushButton, QApplication, QMessageBox
  from PyQt5.QtCore import QCoreApplication, QObject, QEvent

  from userale.ale import Ale

  class TestApplication (QWidget):

      def __init__(self):
          super().__init__()
          self.initUI()

      def initUI(self):
          qbtn = QPushButton('Quit', self)
          qbtn.setObjectName ("testApplicationButton")
          qbtn.clicked.connect(QCoreApplication.instance().quit)
          qbtn.resize(qbtn.sizeHint())
          qbtn.move(50, 50)

          self.setGeometry(300, 300, 250, 150)
          self.setWindowTitle('Quit button')
          self.show()

  if __name__ == '__main__':
      app = QApplication(sys.argv)
      ex = TestApplication()
      # Initiate Apache UserALE.PyQt5
      ale = Ale (output="mouse.log", user="testUser", toolversion="0.0.1")
      # install globally
      app.installEventFilter (ale)

      sys.exit (app.exec_())
  ```

Before we enter the mainloop of the application, UserAle needs to register the application to be instrumented. Simply instantiate Apache UserALE.PyQt5 and install it as an event filter in your application.

  ```python
  # Initiate UserAle
  ale = Ale (output="mouse.log", user="testUser", toolversion="0.0.1")
  # install globally
  app.installEventFilter (ale)
  ```

### Instrumenting Your Application Manually with Apache UserALE.PyQt5

*Todo:* Write guidelines for instrumenting specific PyQt5 Widgets with Apache UserALE.PyQt5.
