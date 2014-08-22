# -*- mode: python; eval: (elpy-mode 0) -*-
from google.appengine.ext import ndb

import json

INIT_STATE = {
    'coins': 60,
}

class State(ndb.Model):
    userid = ndb.StringProperty()
    data = ndb.TextProperty()

#TODO: @ndb.transctional
def get_state_model(userid):
    state = State.query().filter(State.userid == userid).get()
    if not state:
        state = State(userid=userid, data=json.dumps(INIT_STATE))
    return state

def get_state(userid):
    return json.loads(get_state_model(userid).data)

def save_state(userid, state):
    model = get_state_model(userid)
    model.data = json.dumps(state)
    model.put()
