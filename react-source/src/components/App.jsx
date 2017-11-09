import React from 'react';
import { compose, withProps } from 'recompose';
import { withScriptjs, withGoogleMap, GoogleMap, Marker, Polygon } from 'react-google-maps';
import { SearchBox } from 'react-google-maps/lib/components/places/SearchBox';
import GoogleMapLoader from 'react-google-maps-loader';
import { SearchInput, ControlButtonWrapper, ControlButton } from './App.components';
import { MAP_TYPE_RENT, MAP_TYPE_ACCESS } from '../constants';

const GeoJSON = require('json-loader!../../data/tokyo.geojson');
const Suumo = JSON.parse(require('json-loader!../../data/suumo.json'));

function sum(arr, fn) {
  if (fn) {
    return sum(arr.map(fn));
  }

  return arr.reduce(function(prev, current, i, arr) {
    return prev + current;
  }, 0);
};

function average(arr, fn) {
  return sum(arr, fn) / arr.length;
};

class CustomSearchBox extends React.Component {
  onPlacesChanged() {
    const places = this.searchBox.getPlaces();

    if (!places[0]) {
      return null;
    }

    this.props.onPlacesChanged({
      lat: places[0].geometry.location.lat(),
      lng: places[0].geometry.location.lng()
    });
  }

  render() {
    return (
      <SearchBox
        ref={ e => this.searchBox = e }
        controlPosition={ google.maps.ControlPosition.TOP_LEFT }
        onPlacesChanged={ ::this.onPlacesChanged }
      >
        <SearchInput
          type="text"
          placeholder="Search your destination"
        />
      </SearchBox>
    );
  }
}

class ControlBox extends React.Component {
  render() {
    const buttons = this.props.keywords.map((keyword, i) => {
      return (
        <ControlButton
          key={ keyword }
          onClick={ this.props.onClick.bind(this, keyword) }
        >
          { this.props.names[i] }
        </ControlButton>
      );
    });

    return (
      <ControlButtonWrapper>
        { buttons }
      </ControlButtonWrapper>
    );
  }
}

class SelectBox extends React.PureComponent {
  render() {

  }
}

const AccessSelectBox = (props) => {

};

const RentSelectBox = (props) => {
  const numbers = Array.apply(null, { length: 8 }).map(Number.call, Number);

  return (
    <SelectBox
      names={ numbers.map(i => `${10+5*(i+1)}~${10+5*(i+2)}㎡`) }
      keywords={ numbers.map(i => 10 + 5 * i) }
      onSelect={ props.onSelect }
    />
  );
};

class RentMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      targets: [ 15, 20 ]
    };
  }

  render() {
    const polygons = GeoJSON.features.map((feature, i) => {
      const paths = feature.geometry.coordinates[0].map(ary => { return { lat: ary[1], lng: ary[0] } });
      const avg = this.getPriceFromFeature(feature);
      const color = (avg - 5) * 25;
      console.log(avg);

      return (
        <Polygon
          key={ feature.properties.H27KA13_ID }
          paths={ paths }
          options={{
            strokeColor: '#000000',
            strokeOpacity: 0,
            strokeWeight: 0,
            fillColor: `rgb(${color}, 0, 0)`,
            fillOpacity: isNaN(avg) ? 0 : 0.35
          }}
        />
      );
    });

    return [
      polygons
    ];
  }

  getPriceFromFeature(feature) {
    const place = [
      feature.properties.KEN_NAME,
      feature.properties.GST_NAME,
      feature.properties.MOJI
    ].join('').replace(/丁目$/, '');
    const filtered = (Suumo[place] || []).filter(obj =>
      this.state.targets.some(lowerBound => lowerBound <= obj.area && obj.area <= lowerBound + 5)
    );

    return average(filtered.map(obj => obj.rent));
  }
}

class AccessMap extends React.Component {
  render() {
    return null;
  }
}

class AltitudeMap extends React.Component {
  render() {
    return null;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mapType: MAP_TYPE_RENT,
      destination: null
    };
  }

  componentDidMount() {
  }

  onPlacesChanged(place) {
    this.googleMap.panTo(place);
    this.googleMap.setZoom(14);
    this.setState({ destination: place });
  }

  onClickControlBox(mapType) {
    console.log(`Switch to ${mapType}`);
    this.setState({ mapType: mapType });
  }

  render() {
    return (
      <GoogleMap
        defaultZoom={11}
        defaultCenter={{ lat: 35.71215, lng: 139.7626531 }}
        ref={ e => this.googleMap = e }
      >
        <CustomSearchBox
          onPlacesChanged={ ::this.onPlacesChanged }
        />

        { this.state.destination && <Marker position={this.state.destination} /> }

        <ControlBox
          names={[ 'Rent', 'Access', 'Altitude', 'Temp' ]}
          keywords={[ MAP_TYPE_RENT, MAP_TYPE_ACCESS, 'altitude', 'temp' ]}
          onClick={ ::this.onClickControlBox }
        />

        { this.renderMap() }
      </GoogleMap>
    );
  }

  renderMap() {
    switch (this.state.mapType) {
      case MAP_TYPE_RENT:   return <RentMap />;
      case MAP_TYPE_ACCESS: return <AccessMap />;
      default: return <AltitudeMap />;
    }
  }
}

const properties = withProps({
  googleMapURL: "https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=AIzaSyDEG16WeMaOoAtxtKMfp0YUEM2S2CTksh0",
  loadingElement: <div style={{ height: `100%` }} />,
  containerElement: <div style={{ height: `400px` }} />,
  mapElement: <div style={{ height: `100%` }} />,
});

export default compose(properties, withScriptjs, withGoogleMap)(props => <App />);
