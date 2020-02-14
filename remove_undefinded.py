import os, fnmatch
import xml.etree.ElementTree as ET


ALLURE_FOLDER = 'test/allure-results/'

for suiteFile in os.listdir(ALLURE_FOLDER):
    if fnmatch.fnmatch(suiteFile, '*-testsuite.xml'):
        tr = ET.parse(ALLURE_FOLDER + suiteFile)
        suite = tr.getroot().find('test-cases')
        for case in suite:
            if case.get('status') == 'undefined':
                suite.remove(case)
        tr.write(ALLURE_FOLDER + suiteFile)
