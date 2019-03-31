<template>
  <div id="app">
    <nav>
      <div class="tab"><img src="/bch-torch/images/torch-color-565.png"></div>
      <div class="tab"><a href="https://github.com/m4ktub">by Cláudio Gil</a></div>
    </nav>
    <section id="header">
      <div class="header-image"></div>
      <div class="header-container">
        <h1>The Bitcoin Cash Torch</h1>
        <p>Follow the trail of the first and only Bitcoin Cash torch</p>
      </div>
    </section>
    <section id="page">
      <div id="page-offset">
        <div class="separator">
          <div class="title">Cláudio Gil</div>
        </div>
        <ul id="trail">
          <li v-for="(step, index) in trail" :key="step.id" v-bind:class="{ genesis: index == trail.length - 1, last: index == 0 }">
            <span></span>
            <div class="post-container">
              <div class="tx"><a :href="'https://explorer.bitcoin.com/bch/tx/' + step.id">{{ step.id | tx }}</a></div>
              <who v-bind:legacy="step.to"></who>
            </div>
            <div class="date-container">
              <span :title="step.time | timelocale">{{ step.time + (ticker/ticker) | timeago }}</span>
            </div>
            <div class="time"><span class="count">{{ trail.length - index }}</span></div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
<script>
import Who from "./components/Who";
import trail from "./data/trail";
import TimeAgo from "javascript-time-ago";
import TimeAgoEn from "javascript-time-ago/locale/en";
import { canonical } from "javascript-time-ago/gradation";
import axios from "axios";
import Socket from "./socket";

TimeAgo.addLocale(TimeAgoEn);
const timeAgo = new TimeAgo("en-US");

function sanitize(steps) {
  return steps.reduceRight((acc, val) => {
    let last = acc[0];
    if (last && last.to == val.to) {
      acc[0] = val;
      return acc;
    } else {
      acc.unshift(val);
      return acc;
    }
  }, []);
}

export default {
  name: "app",
  data() {
    return {
      ticker: 1,
      trail: sanitize(trail)
    };
  },
  components: {
    who: Who,
  },
  mounted() {
    this.start();
  },
  methods: {
    last() {
      return this.trail[0];
    },
    start() {
      // update trail since step in captured snapshot
      this.load(this.last().id);

      // listen to new transactions
      this.socket = new Socket();
      this.socket.onTransaction(this.monitor.bind(this));

      // update times
      function updateTicker() {
        this.ticker++;
      }
      setInterval(updateTicker.bind(this), 1000);

      // backup purposes
      function makeTrailGlobal() {
        if (this.trail && this.trail.length) {
          window._trail = JSON.parse(JSON.stringify(this.trail));
        }
      }
      setInterval(makeTrailGlobal.bind(this), 60000);
    },
    monitor(tx) {
      let lastTx = this.last();
      let lastTxId = lastTx.id;
      let lastTxVOut = lastTx.vout;

      function matchLastOutput(input) {
        return input.txid == lastTxId && input.n == lastTxVOut;
      }

      let isLastSpent = tx.inputs.some(matchLastOutput);
      if (isLastSpent) {
        this.load(tx.format.txid);
      }
    },
    load(txId) {
      axios
        .get("https://rest.bitcoin.com/v2/slp/txDetails/" + txId)
        .then(response => response.data)
        .then(txDetails => this.addStep(txDetails));
    },
    addStep(txDetails) {
      let txId = txDetails.txid;
      let tokenInfo = txDetails.tokenInfo;
      let index = tokenInfo.sendOutputs.indexOf("1");
      let output = txDetails.vout[index];
      let address = output.scriptPubKey.addresses[0];

      let lastStepTxId = this.last().id;
      let lastStepAddr = this.last().to;
      if (lastStepTxId != txId) {
        let step = {
          id: txId,
          vout: index,
          time: txDetails.time,
          to: address
        };
        
        if (lastStepAddr == address) {
          this.trail[0] = step;
        } else {
          this.trail.unshift(step);
        }
      }

      let spentTxId = output.spentTxId;
      if (spentTxId) {
        this.load(spentTxId);
      }
    }
  },
  filters: {
    timelocale(value) {
      let date = new Date(value * 1000);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    },
    timeago(value) {
      return timeAgo.format(new Date(value * 1000), { gradation: canonical });
    },
    tx(value) {
      return value;
    }
  }
};
</script>