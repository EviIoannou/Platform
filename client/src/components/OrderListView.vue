<template>
    <div id="order-list">

        <div class="flexrow" id="topRow">
            <div class="flexrow arrowBack">
                <v-btn icon class="hidden-xs-only" v-if="account.usertype != 'Client' && !isAdminView">
                    <v-icon @click="$router.go(-1)">mdi-arrow-left</v-icon>
                </v-btn>
            </div>   
            <h2>Orders</h2>
            <!-- <excelupload id="buttonNew" :handler="newOrderHandler" v-if="userOrders && account.usertype != 'Modeller'" @file="file = $event">
                New Order
                <v-icon right>mdi-file-plus</v-icon>
            </excelupload> -->
        </div>
        <div id="itemsView">
            <div class="flexrow" id="filtering">
                <v-text-field
                    v-model="search"
                    append-icon="search"
                    label="Filter"
                    single-line
                    hide-details
                    clearable
					color="#1FB1A9" 
                    class="filter"
                ></v-text-field>
                <v-menu offset-y v-model="menuOpen" v-if="account.usertype != 'Client'">
                <!-- Previous code: filter button does not appear until user writes text in input field -->
                <!-- <v-menu offset-y v-model="menuOpen" v-if="!$emptyObj(filters)"> -->
                    <template v-slot:activator="{ on }">
                        <v-btn v-on="on" class="filterbutton" small rounded dark>
                            Filter
                            <v-icon right>mdi-menu-down</v-icon>
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-item
                            v-for="(text, filter) in filters"
                            :key="filter"
                            @click="searchFor(filter)"
                        >
                        <!-- @click="search += ' ' + filter + ' '" -->
                            <v-list-item-title>{{ text }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
            <!-- Instead of using the Object.values as they are, use a computed property "items" -->
            <!-- :items="Object.values(orders)" -->
            <v-data-table
                id="table"
                :headers="filteredHeaders"
                :items="items"
                :items-per-page="-1"
                :must-sort="true"
                :sort-by="'time'"
                :search="search"
                @click:row="handleClick"
            >
                <!-- Code inspired by solution on https://codepen.io/huntleth/pen/eYOrWog.
                Replaced the code using v-slots for the table with simple <tr> and <td> because:
                    First: it gave many eslint errors
                    Second: to be able to highlight a single row -->
                <template v-slot:body="{ items }">
                    <tbody>
                        <tr 
                        :class="key === selectedRow ? 'highlightedRow' : ''" 
                        @click="rowSelect(key); handleClick(item.orderid)" 
                        v-for="(item, key) in items" 
                        :key="item.orderid">
                            <td>{{item.orderid}}</td>
                            <td>{{$formatDate(item.time)}}</td>
                            <td v-if="account.usertype!=='Client'">{{item.clientname}}</td>
                            <td>
                                <span v-if="item.qaownername">{{item.qaownername}}</span>
                                <span v-else ><i>Unassigned</i></span>
                            </td>
                            <!-- State is already defined in items() -->
                            <!-- <td>
                                {{backend.messageFromStatus(item.state, account.usertype)}}
                            </td> -->
                            <td>{{item.state}}</td>
                            
                            <td>{{item.models}}</td>
                            
                            <!-- Products already defined in items() -->
                            <!-- <td>{{sumProducts(item)}}</td> -->
                            <td>{{item.products}}</td>
                        </tr>
                    </tbody>
                </template>
                <!-- <template v-slot:item.complete="{item}">
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                            <v-progress-linear
                                :buffer-value="100"
                                :height="10"
                                :rounded="true"
                                :value="item.complete/item.models * 100"
                                color="#2196f3"
                                v-on="on"
                            ></v-progress-linear>
                        </template>
                        <span>{{item.complete}} / {{item.models}}</span>
                    </v-tooltip>
                </template>
                <template v-slot:item.qaownername="{value}">
                    <span v-if="value">{{value}}</span>
                    <span v-else ><i>Unassigned</i></span>
                </template>
                <template v-slot:item.state="{value}">
                    {{backend.messageFromStatus(value, account.usertype)}}
                    <v-icon>{{backend.iconFromStatus(value, account.usertype)}}</v-icon>
                </template> -->
                            <!-- This template for barchart is not used anymore: -->
                            <!-- <template v-slot:item.partitiondata="{value}"> -->
                                <!-- this bar chart will not be displayed when OrderView is displayed
                                next to the orders list -->
                                <!-- <barchart :productdata="value" :account="account"/>
                            </template> -->
                <!-- <template v-slot:item.products="{item}">
                    {{sumProducts(item)}}
                </template>
                <template v-slot:item.time="{value}">{{$formatDate(value)}}</template> -->
            </v-data-table>
        </div>
        <!-- This div is displayed when there are no orders, i.e. no data to display -->
        <div class="emptyState" 
            v-if="Object.values(orders).length == 0">
            <!-- Different messages for different user types: -->
            <span v-if="account.usertype=='Client'">You have not placed any orders</span>
            <span v-else>The client has not placed any orders</span>  
        </div>
        <div class="newOrder" v-if="account.usertype=='Client'">
            <excelupload 
            id="buttonNew" 
            :handler="newOrderHandler" 
            v-if="userOrders && account.usertype != 'Modeller'" 
            @file="file = $event"
            title="New Order">
                New Order
                <v-icon right>mdi-file-plus</v-icon>
            </excelupload>    
        </div>
        
    </div>
</template>

<script>
import backend from "../backend";
// import barchart from './BarChart'
import excelupload from './ExcelUpload'

export default {
    props: {
        account: { type: Object,  required: true },
        isAdminView : { type: Boolean, default: false},
        orders: { type: Object, required: true},
        userOrders: { type: Boolean, required: true}
    },
    components: {
        // barchart,
        excelupload
    },
    data() {
        return {
            headers: [
                { text: "ID", value: "orderid"},
                { text: "Date", value: "time" },
                { text: "Client", value: "clientname", hideClient: true},
                { text: "Assigned QA", value: "qaownername"},
                { text: "Status", value: "state"},
                { text: "Models", value: "models"},
                { text: "Products", value: "products"},
                // { text: "Product states", value: "partitiondata"},
            ],
            filters: {},
            newOrderHandler: backend.promiseHandler(this.newOrder),
            file: false,
            search: "",
            backend: backend,
            menuOpen: false,
            selectedRow: 0

            /* Have moved to parent (OrderOverview.vue): */
            // orders: {} 
            // user: {}, 
            // userOrders: false
        };
    },
    computed: {
        filteredHeaders() {
            if(this.account.usertype == 'Client') {
                return this.headers.filter(header => header.hideClient != true);
            }
            return this.headers
        },
        items(){
            // Create an items array to use as data in the table 
            // so that "value" in the headers matches exactly the table data;
            // this makes "search" work properly
            var account = this.account.usertype
            return Object.values(this.orders).map(order => (
                {
                    orderid: order.orderid,
                    time: order.time,
                    clientname: order.clientname,
                    qaownername: order.qaownername,
                    state: backend.messageFromStatus(order.state, account),
                    models: order.models,
                    products: this.sumProducts(order)
                }
            ))
        }
    },
    methods: {
        sumProducts(item) {
            var sum = 0;
            var states =  Object.values(item.partitiondata)
            states.forEach(state => {
                sum += parseInt(state.count);
            })
            return sum;
        },
        handleClick(orderid) {
            this.$emit('clicked-order', orderid)  
        /* instead of pushing a route, use the id as a prop to populate OrderView component */        
        // this.$router.push("/order/" + order.orderid);
        },
        rowSelect(index) {
            this.selectedRow = index;
        },
        newOrder() {
            var vm = this;
            if (vm.file) {
                return backend.createOrder(vm.file, vm.$route.params.id).then(() => {
                   //added to remove the typeerror-getOrders is not a function.
				/* vm.getOrders(); */
					this.$emit('created-order');
                }).then(()=> { this.selectedRow = 0 })
            }
        },
        searchFor(filter) {
            if (this.search!=='' && this.search!==null) {
                if(!this.search.includes(filter)) {
                    return this.search += ' ' + filter + ' '  
                }
                else { return this.search }
            }
            else { 
                this.search = '';
                return this.search += ' ' + filter + ' '
            }
                        

        }
        /* has moved to parent (OrderOverview.vue) */

        // getOrders() { 
        //     var vm = this;
        //     if (vm.isAdminView) {
        //     backend
        //         .getAllOrders()
        //         .then(orders => {
        //             vm.orders = orders;

        //             //dynamically get the first order to show details for
        //             vm.initialOrderId = Object.values(orders)[0].orderid
        //         })
        //         .catch(error => {
        //             vm.error = error;
        //         });
        //     } else {
        //         vm.userOrders = true;
        //         vm.user.userid = vm.$route.params.id;
        //         backend.getOrders(vm.user.userid).then(orders => {
        //             vm.orders = orders;

        //             //dynamically get the first order to show details for
        //             vm.initialOrderId = Object.values(orders)[0].orderid
        //         });
        //     }

        // },
    },
    mounted() {
        var vm = this;
        if (vm.account.usertype == "QA" || vm.account.usertype == "Admin") {
            vm.filters[vm.account.name] = "Assigned to me";
            // Changed the filter key; no need to have the code for unassigned, we can just write "unassigned"
            vm.filters['Unassigned'] = "Unassigned";

            // vm.filters['OrderReceived'] = "Unassigned";
        }
        // vm.getOrders(); // has moved to parent (OrderOverview.vue)
    }
};
</script>

<style lang="scss" scoped>
#topRow {
    // justify-content: center;
    margin-bottom: 10px;
    // to display the arrow on the left of the component, and title in the center:
    .arrowBack {
        width: 40%;
        justify-content: start
    }
    h2 {
        width: 60%;
    }
}
#table {
    max-height: 100vh;
    // max-height: 70vh;
    overflow: auto;
    width: 50vw // to fit both order list and order details
    // width: 80vw;
}

#table.v-data-table-header th {
  width: 10%
}

.error {
    color: #d12300;
    margin-bottom: 5px;
}
.filter {
    margin-bottom: 15px;
}
.filterbutton {
    margin-left: 10px;
}
.flexrow#filtering {
    align-items: center;
}

#order-list {
    /* Not sure about this border, but it felt right to separate the two sections*/
    padding-right: 1em;
    margin-right: 1em;
    border-right: 2px solid rgb(179, 179, 179);
}

.highlightedRow {
    background-color: rgba(31, 177, 169, 0.1);
}

div.newOrder {
    margin-top: 50px;
    display: flex;
    justify-content: flex-end;
}

div.emptyState {
    height: 170px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #515151;
}
</style>