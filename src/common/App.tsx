import { MuiThemeProvider } from '@material-ui/core';
import * as React from 'react';
import { ApolloProvider } from 'react-apollo';
import { JssProvider } from 'react-jss'; // /lib/JssProvider';
import { Provider } from 'react-redux';

import { mainTheme } from './themes';

import LayoutChooser from './components/LayoutChooser';

const App = ({ store, sheetsRegistry, generateId, jss, apolloClient }) => (
  <Provider store={store}>
    <ApolloProvider client={apolloClient}>
      <JssProvider registry={sheetsRegistry} generateId={generateId} jss={jss}>
        <MuiThemeProvider theme={mainTheme}>
          <LayoutChooser />
        </MuiThemeProvider>
      </JssProvider>
    </ApolloProvider>
  </Provider>
);

export default App; // sheetsManager={new Map()}
