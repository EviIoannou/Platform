<template>
    <div id="item">
        <div class="row" id="topRow">
            <v-btn icon class="hidden-xs-only">
                <v-icon @click="$router.go(-1)">mdi-arrow-left</v-icon>
            </v-btn>
            <excelupload id="buttonNew" :handler="addProducts" v-if="account.usertype == 'Client' && model.state != 'Done' && false" @file="file = $event">
                Add products
                <v-icon right>mdi-file-plus</v-icon>
            </excelupload>
        </div>
        <v-progress-circular v-if="!model" indeterminate></v-progress-circular>
        <v-tabs v-model="tab" show-arrows v-else>
            <v-tabs-slider></v-tabs-slider>
            <v-tab v-if="account.usertype != 'Client'" :href="`#blendertab`">Model</v-tab>
            <v-tab v-for="(p, id) in products" :key="id" :href="`#tab-${id}`">{{p.color}}</v-tab>
            <v-tab-item :value="'blendertab'" class="tab">
                <blenderview :model="model" :account="account" @state="updateOnStateChange"/>
            </v-tab-item>
            <v-tab-item class="tab" v-for="(p, id) in products" :key="id" :value="'tab-' + id">
                <productview :model="model" :product="p" :account="account" @state="updateOnStateChange"/>
            </v-tab-item>
        </v-tabs>
    </div>
</template>
<script>
import blenderview from "./BlenderView";
import productview from "./ProductView";
import backend from "../backend";
import Vue from "vue";
import excelupload from './ExcelUpload'

export default {
    components: {
        blenderview,
        productview,
        excelupload
    },
    props: {
        account: { type: Object, required: true }
    },
    data() {
        return {
            tab: "",
            products: [],
            model: false,
            file: false,
            addProducts: backend.promiseHandler(this.createProducts)
        };
    },
    methods: {
        updateOnStateChange() {
            var vm = this;
            backend.getModel(vm.model.modelid).then(model => {
                vm.model.state = model.state;
            });
            backend.getProducts(vm.model.modelid).then(products => {
                Vue.set(vm, "products", products);
            })
        },
        createProducts() {
            var vm = this;
            if (vm.file) {
                return backend.createProducts(vm.model.modelid, vm.file).then(() => {
                    vm.file = false
                        backend.getProducts(vm.model.modelid).then(products => {
                            Vue.set(vm, "products", products);
                        })
                });
            }
        },
    },
    mounted() {
        var vm = this;
        var modelid = vm.$route.params.id;
        backend.getModel(modelid).then(model => {
            model.files = [];
            vm.model = model;
        });
        backend.getProducts(modelid).then(products => {
            Vue.set(vm, "products", products);
        })
    }
};
</script>

<style lang="scss" scoped>
#item {
    width: 80vw;
}

#topRow {
    justify-content: space-between;
    margin-bottom: 10px;
}

.tab {
    margin-top: 20px !important;
}
</style>