{
   "_id": "_design/bold",
   "_rev": "4-c4b73b4f7d39acec751b2c4310a66f1b",
   "language": "javascript",
   "views": {
       "nt": {
           "map": "/*\n\nShared code\n\n\n*/\n//----------------------------------------------------------------------------------------\n// Store a triple with optional language code\nfunction triple(subject, predicate, object, language) {\n  var triple = [];\n  triple[0] = subject;\n  triple[1] = predicate;\n  triple[2] = object;\n\n  if (typeof language === 'undefined') {} else {\n    triple[3] = language;\n  }\n\n  return triple;\n}\n\n//----------------------------------------------------------------------------------------\n// Store a quad (not used at present)\nfunction quad(subject, predicate, object, context) {\n  var triple = [];\n  triple[0] = $subject;\n  triple[1] = $predicate;\n  triple[2] = $object;\n  triple[3] = $context;\n\n  return triple;\n}\n\n//----------------------------------------------------------------------------------------\n// Enclose triple in suitable wrapping for HTML display or triplet output\nfunction wrap(s, html) {\n  if (s.match(/^(http|urn|_:)/)) {\n    if (html) {\n      s = '&lt;' + s + '&gt;';\n    } else {\n      s = '<' + s + '>';\n    }\n  } else {\n    s = '\"' + s.replace(/\"/g, '\\\\\"') + '\"';\n  }\n  return s;\n}\n\n//----------------------------------------------------------------------------------------\n// https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/\nfunction htmlEntities(str) {\n  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');\n}\n\n//----------------------------------------------------------------------------------------\nfunction output(doc, triples) {\n    // CouchDB\n    for (var i in triples) {\n      var s = 0;\n      var p = 1;\n      var o = 2;\n\n      var lang = 3;\n\n      var nquads = wrap(triples[i][s], false) \n\t    \t+ ' ' + wrap(triples[i][p], false) \n\t    \t+ ' ' + wrap(triples[i][o], false);\n\t    if (triples[i][lang]) {\n\t    \tnquads += '@' + triples[i][lang];\n\t    }\n\t    \t\n\t    nquads += ' .' + \"\\n\";\n\n\n      emit(doc._id, nquads);\n    }\n}\n\n// geohash.js\n// Geohash library for Javascript\n// (c) 2008 David Troy\n// Distributed under the MIT License\nBITS = [16, 8, 4, 2, 1];\n\nBASE32 = \"0123456789bcdefghjkmnpqrstuvwxyz\";\nNEIGHBORS = {\n  right: {\n    even: \"bc01fg45238967deuvhjyznpkmstqrwx\"\n  },\n  left: {\n    even: \"238967debc01fg45kmstqrwxuvhjyznp\"\n  },\n  top: {\n    even: \"p0r21436x8zb9dcf5h7kjnmqesgutwvy\"\n  },\n  bottom: {\n    even: \"14365h7k9dcfesgujnmqp0r2twvyx8zb\"\n  }\n};\nBORDERS = {\n  right: {\n    even: \"bcfguvyz\"\n  },\n  left: {\n    even: \"0145hjnp\"\n  },\n  top: {\n    even: \"prxz\"\n  },\n  bottom: {\n    even: \"028b\"\n  }\n};\n\nNEIGHBORS.bottom.odd = NEIGHBORS.left.even;\nNEIGHBORS.top.odd = NEIGHBORS.right.even;\nNEIGHBORS.left.odd = NEIGHBORS.bottom.even;\nNEIGHBORS.right.odd = NEIGHBORS.top.even;\n\nBORDERS.bottom.odd = BORDERS.left.even;\nBORDERS.top.odd = BORDERS.right.even;\nBORDERS.left.odd = BORDERS.bottom.even;\nBORDERS.right.odd = BORDERS.top.even;\n\nfunction refine_interval(interval, cd, mask) {\n  if (cd & mask)\n    interval[0] = (interval[0] + interval[1]) / 2;\n  else\n    interval[1] = (interval[0] + interval[1]) / 2;\n}\n\nfunction calculateAdjacent(srcHash, dir) {\n  srcHash = srcHash.toLowerCase();\n  var lastChr = srcHash.charAt(srcHash.length - 1);\n  var type = (srcHash.length % 2) ? 'odd' : 'even';\n  var base = srcHash.substring(0, srcHash.length - 1);\n  if (BORDERS[dir][type].indexOf(lastChr) != -1)\n    base = calculateAdjacent(base, dir);\n  return base + BASE32[NEIGHBORS[dir][type].indexOf(lastChr)];\n}\n\nfunction decodeGeoHash(geohash) {\n  var is_even = 1;\n  var lat = [];\n  var lon = [];\n  lat[0] = -90.0;\n  lat[1] = 90.0;\n  lon[0] = -180.0;\n  lon[1] = 180.0;\n  lat_err = 90.0;\n  lon_err = 180.0;\n\n  for (i = 0; i < geohash.length; i++) {\n    c = geohash[i];\n    cd = BASE32.indexOf(c);\n    for (j = 0; j < 5; j++) {\n      mask = BITS[j];\n      if (is_even) {\n        lon_err /= 2;\n        refine_interval(lon, cd, mask);\n      } else {\n        lat_err /= 2;\n        refine_interval(lat, cd, mask);\n      }\n      is_even = !is_even;\n    }\n  }\n  lat[2] = (lat[0] + lat[1]) / 2;\n  lon[2] = (lon[0] + lon[1]) / 2;\n\n  return {\n    latitude: lat,\n    longitude: lon\n  };\n}\n\nfunction encodeGeoHash(latitude, longitude) {\n  var is_even = 1;\n  var i = 0;\n  var lat = [];\n  var lon = [];\n  var bit = 0;\n  var ch = 0;\n  var precision = 12;\n  geohash = \"\";\n\n  lat[0] = -90.0;\n  lat[1] = 90.0;\n  lon[0] = -180.0;\n  lon[1] = 180.0;\n\n  while (geohash.length < precision) {\n    if (is_even) {\n      mid = (lon[0] + lon[1]) / 2;\n      if (longitude > mid) {\n        ch |= BITS[bit];\n        lon[0] = mid;\n      } else\n        lon[1] = mid;\n    } else {\n      mid = (lat[0] + lat[1]) / 2;\n      if (latitude > mid) {\n        ch |= BITS[bit];\n        lat[0] = mid;\n      } else\n        lat[1] = mid;\n    }\n\n    is_even = !is_even;\n    if (bit < 4)\n      bit++;\n    else {\n      geohash += BASE32[ch];\n      bit = 0;\n      ch = 0;\n    }\n  }\n  return geohash;\n}\n\n\nfunction message(doc) {\n\n\n  var bold_dwc_map = [];\n\n  // location\n  bold_dwc_map['country'] = 'country';\n  bold_dwc_map['region'] = 'stateProvince';\n  bold_dwc_map['province'] = 'stateProvince';\n  bold_dwc_map['exactsite'] = 'locality';\n  bold_dwc_map['lat'] = 'decimalLatitude';\n  bold_dwc_map['lon'] = 'decimalLongitude';\n\n  // event\n  bold_dwc_map['collectiondate'] = 'verbatimEventDate';\n  bold_dwc_map['fieldnum'] = 'fieldNumber';\n\n\n  // identification\n  bold_dwc_map[\"species_name\"] = 'scientificName';\n  bold_dwc_map[\"identification_provided_by\"] = 'identifiedBy';\n\n\n  // occurrence\n  bold_dwc_map['processid'] = 'otherCatalogNumbers';\n  bold_dwc_map['sampleid'] = 'otherCatalogNumbers';\n  bold_dwc_map['catalognum'] = 'catalogNumber';\n  bold_dwc_map['recordID'] = 'recordNumber';\n  bold_dwc_map['collectors'] = 'recordedBy';\n  bold_dwc_map['lifestage'] = 'lifestage';\n  bold_dwc_map['notes'] = 'occurrenceRemarks';\n\n  bold_dwc_map['institution_storing'] = 'institutionCode';\n\n\n\n  // media\n\n\n\n  var triples = [];\n\n  //var cluster_id = 'http://bins.boldsystems.org/index.php/Public_RecordView?processid=' + doc.message.processid;\n  var cluster_id = 'http://www.boldsystems.org/index.php/API_Public/combined?ids=' + doc.message.processid + '&format=tsv';\n\n  var item_id = 'http://bins.boldsystems.org/index.php/Public_RecordView?processid=' + doc.message.processid;\n  var occurrence_id = item_id; // item is an occurrence\n\n  var locality_id = '';\n  var event_id = '';\n  var identification_id = '';\n\n  triples.push(triple(occurrence_id,\n    'http://schema.org/name',\n    doc.message.processid));\n  \n  triples.push(triple(occurrence_id,\n    'http://purl.org/dc/terms/identifier',\n    occurrence_id));\n  triples.push(triple(occurrence_id,\n    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n    'http://rs.tdwg.org/dwc/terms/Occurrence'));\n\n  triples.push(triple(cluster_id,\n    'http://schema.org/item',\n    item_id));\n\n  for (var i in doc.message) {\n\n    switch (i) {\n\n\n      // Darwin Core Identification----------------------------------------------------------\n      case \"species_name\":\n      case \"identification_provided_by\":\n        // b-node\n        // any examples of identifiers?\n        if (identification_id == '') {\n          // b-node\n          identification_id = item_id + '#identification';\n\n\n          triples.push(triple(identification_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://rs.tdwg.org/dwc/terms/Identification'));\n\n          // link to taxon\n          if (doc.message.bin_uri) {\n            triples.push(triple(identification_id,\n              'http://rs.tdwg.org/dwc/terms/taxonID',\n              'http://bins.boldsystems.org/index.php/Public_BarcodeCluster?clusteruri=' + doc.message.bin_uri));\n\n          }\n\n          // link to cluster\n          triples.push(triple(item_id,\n            'http://rs.tdwg.org/dwc/terms/identificationID',\n            identification_id));\n\n        }\n        triples.push(triple(identification_id,\n          'http://rs.tdwg.org/dwc/terms/' + bold_dwc_map[i],\n          String(doc.message[i])));\n        break;\n\n\n\n        // Occurrence (usually a specimen)\n        // Darwin Core occurrence---------------------------------------------------------\n      case 'processid':\n      case 'sampleid':\n      case 'recordID':\n      case 'catalognum':\n      case 'institution_storing':\n      case 'lifestage':\n      case 'notes':\n\n        triples.push(triple(occurrence_id,\n          'http://rs.tdwg.org/dwc/terms/' + bold_dwc_map[i],\n          String(doc.message[i])));\n        break;\n\n\n\n        // Darwin Core Event----------------------------------------------------------\n      case 'collectiondate':\n      case 'fieldnum':\n        // b-node\n        // any examples of identifiers?\n        if (event_id == '') {\n          // b-node\n          event_id = item_id + '#event';\n\n          triples.push(triple(event_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://rs.tdwg.org/dwc/terms/Event'));\n\n          // link to cluster\n          triples.push(triple(item_id,\n            'http://rs.tdwg.org/dwc/terms/eventID',\n            event_id));\n\n        }\n        triples.push(triple(event_id,\n          'http://rs.tdwg.org/dwc/terms/' + bold_dwc_map[i],\n          String(doc.message[i])));\n        break;\n\n\n        // Darwin Core locality-----------------------------------------------------------\n      case 'country':\n        //case 'region':\n      case 'province':\n      case 'lat':\n      case 'lon':\n\n        // b-node (maybe with global identifer)\n        if (locality_id == '') {\n          var geohash = '';\n\n          locality_id = item_id + '#locality';\n          if (doc.message.lat && doc.message.lon) {\n            geohash = encodeGeoHash(doc.message.lat, doc.message.lon);\n            locality_id = 'http://geohash.org/' + geohash;\n          }\n\n          // types\n          triples.push(triple(locality_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://purl.org/dc/terms/Location'));\n\n          triples.push(triple(locality_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://schema.org/Place'));\n\n          // link to cluster\n          triples.push(triple(item_id,\n            'http://rs.tdwg.org/dwc/terms/locationID',\n            locality_id));\n\n\n          // Store the geohash\n          if (geohash != '') {\n            triples.push(triple(locality_id,\n              'http://www.w3.org/ns/locn#geometry',\n              'http://geohash.org/' + geohash));\n          }\n\n          if (doc.message.lat && doc.message.lon) {\n\n            // map\n            var mapUrl = 'http://www.openstreetmap.org/' +\n              '?mlat=' + doc.message.lat +\n              '&mlon=' + doc.message.lon +\n              '&zoom=8';\n\n            triples.push(triple(locality_id,\n              'http://schema.org/hasMap',\n              mapUrl));\n\n\n            // geo\n            var geo_id = locality_id + '/geo';\n\n            triples.push(triple(locality_id,\n              'http://schema.org/geo',\n              geo_id));\n\n            triples.push(triple(geo_id,\n              'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n              'http://schema.org/GeoCoordinates'));\n            triples.push(triple(geo_id,\n              'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n              'http://schema.org/GeoCoordinates'));\n            triples.push(triple(geo_id,\n              'http://schema.org/latitude',\n              String(doc.message.lat)));\n            triples.push(triple(geo_id,\n              'http://schema.org/longitude',\n              String(doc.message.lon)));\n\n          }\n\n        }\n        triples.push(triple(locality_id,\n          'http://rs.tdwg.org/dwc/terms/' + bold_dwc_map[i],\n          String(doc.message[i])));\n        break;\n\n        // sequences\n      case 'genbank_accession':\n        triples.push(triple(item_id,\n          'http://rs.tdwg.org/dwc/terms/associatedSequences',\n          'http://identifiers.org/insdc/' + doc.message[i]));\n        break;\n\n\n      default:\n        break;\n\n    }\n\n\n  }\n\n  // images\n  if (doc.message.image_urls) {\n    var image_urls = doc.message.image_urls.split('|');\n    if (image_urls) {\n\n      var image_ids = doc.message.image_ids.split('|');\n      var copyright_licenses = doc.message.copyright_licenses.split('|');\n\n      var n = image_urls.length;\n      for (var i = 0; i < n; i++) {\n\n        var media_id = item_id + '#' + image_ids[i];\n\n        // link to data\n        triples.push(triple(media_id,\n          'http://schema.org/about',\n          item_id));\n\n        // type\n        triples.push(triple(media_id,\n          'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n          'http://schema.org/ImageObject'));\n\n        // url\n        triples.push(triple(media_id,\n          'http://schema.org/contentUrl',\n          image_urls[i]));\n\n        if (image_urls[i].match(/.jpg/)) {\n          triples.push(triple(media_id,\n            'http://schema.org/fileFormat',\n            'image/jpeg'));\n        }\n\n\n        // license\n        if (doc.message.copyright_licenses) {\n          triples.push(triple(media_id,\n            'http://schema.org/license',\n            copyright_licenses[i]));\n        }\n\n\n\n      }\n    }\n  }\n\n\n  // alternative specimen codes\n  for (var i in doc.message) {\n\n    switch (i) {\n      case \"processid\":\n      case \"sampleid\":\n      case \"recordID\":\n      case \"catalognum\":\n      case \"fieldnum\":\n        triples.push(triple(occurrence_id,\n          'http://schema.org/alternateName',\n          String(doc.message[i])));\n        break;\n\n      default:\n        break;\n    }\n  }\n\n\n  // defaults\n  triples.push(triple(cluster_id,\n    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n    'http://schema.org/DataFeedItem'));\n\n\n  output(doc, triples);\n}\n\nfunction(doc) {\n  if (doc['message-format']) {\n    if (doc['message-format'] == 'text/tab-separated-values') {\n      message(doc);\n    }\n  }\n}"
       },
       "modified": {
           "map": "function(doc) {\n  if (doc['message-format']) {\n    if (doc['message-format'] == 'text/tab-separated-values') {\n     if (doc.message) {\n      emit(doc['message-modified'], doc._id);\n     }\n    }\n  }\n}"
       }
   }
}