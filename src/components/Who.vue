<template>
  <div class="who">
    <span class="twitter" v-if="isTwitter">
      <div v-if="shouldDisplayTwitter">
        <Tweet :id="details.twitter | twitterid" :options="{ cards: 'hidden', conversation: 'none', width: '550' }"/>
      </div>
      <div v-else>
        <!--<img src="details.twitter | twitteruser"> If you run it on a server-->
        <a v-bind:href="details.twitter">{{ details.twitter | twitteruser }}</a>
      </div>
    </span>
    <span class="reddit" v-if="isReddit">
      <a v-bind:href="details.reddit">{{ details.reddit | reddituser }}</a>
    </span>
    <span class="address" v-if="isLegacy">
      <a v-bind:href="address | linkaddress">{{ address | toslpaddr }}</a>
    </span>
    <div class="images">
      <span v-if="hasCountry" class="flag">
        <img v-bind:src="'https://www.countryflags.io/' + details.country + '/flat/32.png'">
      </span>
      <span v-if="hasBadge" class="badges">
        <img v-for="step in details.badges" :key="step" v-bind:src="'/bch-torch/images/' + step" height="32">
      </span>
    </div>
  </div>
</template>

<script>
import users from "../data/users";
import slpaddr from "bchaddrjs-slp";
import { Tweet, Moment, Timeline } from "vue-tweet-embed";
var request = require('request');

export default {
  name: "who",
  components: {
    Tweet
  },
  props: {
    legacy: String,
    cashaddr: String
  },
  data() {
    return {
      address: this.cashaddr || this.legacy,
      details: users[this.legacy]
    };
  },
  computed: {
    isTwitter() {
      return this.details && !!this.details.twitter;
    },
    shouldDisplayTwitter() {
      return this.details.twitter.includes("status");
    },
    isReddit() {
      return this.details && !!this.details.reddit;
    },
    isLegacy() {
      return this.details == null;
    },
    hasCountry() {
      return this.details && !!this.details.country;
    },
    hasBadge() {
      return this.details && !!this.details.badges;
    }
  },
  filters: {
    twitteruser(url) {
      let match = url.match(/twitter.com\/([^/]+)/);
      //var url = "https://twitter.com/" + match[1] + "/profile_image/?size=original";
      return "@" + match[1];

      /*var r = request.get(url, function (err, res, body) {
        console.log(r.uri.href);
        return(r.uri.href);
      });*/
    },
    twitterid(url) {
      if(url.includes("status")) {
        return url.split("status")[1].split("/")[1];
      } else {
        return url;
      }
    },
    reddituser(url) {
      let match = url.match(/reddit.com\/([^/]+\/[^/]+)/);
      return match ? "/" + match[1] : url;
    },
    linkaddress(address) {
      return "https://explorer.bitcoin.com/bch/address/" + slpaddr.toCashAddress(address);
    },
    toslpaddr(address) {
      return slpaddr.toSlpAddress(address).replace("simpleledger:", "");
    }
  }
};
</script>
