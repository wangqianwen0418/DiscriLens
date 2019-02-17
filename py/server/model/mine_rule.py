# encoding: utf-8


from collections import defaultdict, namedtuple

import pandas
from sklearn import preprocessing
import csv
import numpy as np


def find_rules(df, minimum_support, min_len, protect_attr, target_attr, risk_th=None, elift_th=None):
    """
    Args:
        df (pandas dataframe): columns are attributes, each row is an item
        minimum_support(int): the minimum number of occurrences of the rules. e.g., support(A, B, C)
        min_len: the minimum length of the antecedent itemsets. e.g., len([A,B])=2
        protect_attr(string): specifi the consequent attribute. e.g., gender
        target_attr(string): specifi the consequent attribute, e.g., class
        risk_th ([float, float])
        elift_th ([float, float])
    Return:
        pd_rules (pandas DataFrame): columns = ['antecedent', 'pd', 'cls', 'conf_pd', 'conf_pnd', 'risk_dif', 'elift', 'sup_pd', 'sup_pnd']
            id (number)
            antecedent (list of string, e.g., [VisITedResources=x>74, NationalITy=Jordan])
            pd (string): e.g., gender=F
            cls (string): e.g., class=M
            conf_pnd(float): conf(antecedent -> cls)
            conf_pd(float): conf(antecedent+pd -> cls)
            risk_dif(float): conf_pd - conf_pnd
            elift(float): conf_pd / conf_pnd
            sup_pnd(int): support(antecedent+cls)
            sup_pd(int): support(antecedent+pd+cls)

    """
    #
    if not risk_th:
        risk_th=[0,0]
    if not elift_th:
        elift_th=[1,1]
    # apply col name to each cell for mining frequent itemsets
    new_df = pandas.DataFrame({col:str(col)+'=' for col in df}, index=df.index) + df.astype(str) 
    # convert to list
    transactions = new_df.values.tolist()

    cls_pairs = pandas.DataFrame(columns = ['antecedent', 'cls', 'antecedent_sup', 'sup'])
    pd_pairs = pandas.DataFrame(columns = ['antecedent', 'pd', 'antecedent_sup', 'sup'])
    
    # store pairs
    for pair in find_freq_itemsets(transactions, minimum_support, min_len, protect_attr, target_attr):
        if pair[0]=='cls_pair':
            cls_pairs.loc[len(cls_pairs)] = list(pair[1:])
        elif pair[0] == 'pd_pair':
            pd_pairs.loc[len(pd_pairs)] = list(pair[1:])

    # find pontential discriminatory rules
    pd_rules = pandas.DataFrame(columns = ['antecedent', 'pd', 'cls', 'conf_pd', 'conf_pnd', 'risk_dif', 'elift', 'sup_pd', 'sup_pnd'])

    for pair in pd_pairs.itertuples(): 
        pnd_items = pair.antecedent # potentially non discrimination itemsets
        pd_items = pair.antecedent+ [pair.pd] # potentially discrimination itemsets

        # find the corresponding pnd classification rules
        for pnd_cls in cls_pairs.loc[ cls_pairs['antecedent'].apply(set) == set(pnd_items) ].itertuples():
            # find the corresponding pd classification rule
            cls_ = pnd_cls.cls
            pd_cls = cls_pairs.loc[ ( cls_pairs['antecedent'].apply(set) == set(pd_items) ) & (cls_pairs['cls'] == cls_) ]
            if not pd_cls.empty:
                conf_pnd = float(pnd_cls.sup/pnd_cls.antecedent_sup)
                conf_pd = float(pd_cls.sup/pd_cls.antecedent_sup)
                risk_dif = float(conf_pd-conf_pnd)
                elift = float(conf_pd/conf_pnd)
                if not risk_th[0] <= risk_dif <= risk_th[1]:
                    pd_rules.loc[len(pd_rules)] = [pnd_items, pair.pd, cls_, conf_pd, conf_pnd, risk_dif, elift, float(pd_cls.sup), float(pnd_cls.sup)]
    
    pd_rules = pd_rules.sort_values(by=['risk_dif'])
    pd_rules.insert(loc=0, column='id', value=pd_rules.index)

    return pd_rules


def find_freq_itemsets(transactions, minimum_support, min_len, protect_attr, target_attr):
    """
    Find rules (e.g., A,B -> C) in the given transactions using FP-growth. 
    This function returns a generator instead of an eagerly-populated list of items.
    Args:
        transactions: any iterable of iterables of items. Each item must be hashable (i.e., it must be valid as a member of a dictionary or a set).
        minimum_support(int): the minimum number of occurrences of the rules. e.g., support(A, B, C)
        min_len: the minimum length of the antecedent itemsets. e.g., len([A,B])=2
        protect_attr(string): specifi the consequent attribute. e.g., gender
        target_attr(string): specifi the consequent attribute, e.g., class
    Yield:
        set(antecedent, consequent, antecedent_support, conf) 
            antecedent (list<string>)
            consequent (string)
            antecedent_support (int)
            conf (float)
    """
    items = defaultdict(lambda: 0) # mapping from items to their supports

    # Load the passed-in transactions and count the support that individual
    # items have.
    for transaction in transactions:
        for item in transaction:
            items[item] += 1

    # Remove infrequent items from the item support dictionary.
    items = dict((k, items[k]) for k in items
        if items[k] >= minimum_support)

    # remove infrequent items
    # sorted remaining items in decreasing order of frequency.
    def clean_transaction(transaction):
        transaction = list(filter(lambda v: v in items, transaction))
        transaction.sort(key=lambda v: items[v], reverse=True)
        return transaction

    # Build FP-tree.
    master = FPTree()
    for transaction in map(clean_transaction, transactions):
        master.add(transaction)

    # find frequent itemsets
    def find_with_suffix(tree, suffix, antecedent_support):
        for item, nodes in tree.items(): # nodes: the sequence of nodes that contain the given item.
            support = sum(n.count for n in nodes)
            if support >= minimum_support and item not in suffix:
                # New winner!
                found_set = [item] + suffix
                # the new frequent itemsets
                # yield (found_set, support) if include_support else found_set

                # decide which rule will be return
                if len(suffix) >= min_len and target_attr in item:
                    # conf = support/antecedent_support
                    antecedent = suffix
                    consequent = item 
                    yield ('cls_pair', antecedent, consequent, antecedent_support, support) 
                elif len(suffix) >= min_len and protect_attr in item:
                    antecedent = suffix
                    consequent = item 
                    yield ('pd_pair', antecedent, consequent, antecedent_support, support) 

                # Build a conditional tree and recursively search for frequent
                # itemsets within it.
                cond_tree = conditional_tree_from_paths(tree.prefix_paths(item))
                for s in find_with_suffix(cond_tree, found_set, support):
                    yield s # pass along the good news to our caller

    # Search for frequent itemsets, and yield the results we find.
    for itemset in find_with_suffix(master, [], 0):
        yield itemset

class FPTree(object):
    """
    An FP tree.
    This object may only store transaction items that are hashable
    (i.e., all items must be valid as dictionary keys or set members).
    """

    Route = namedtuple('Route', 'head tail')

    def __init__(self):
        # The root node of the tree.
        self._root = FPNode(self, None, None)

        # A dictionary mapping items to the head and tail of a path of
        # "neighbors" that will hit every node containing that item.
        # key: itemname, value: namedtuple Route
        self._routes = {}

    @property
    def root(self):
        """The root node of the tree."""
        return self._root

    def add(self, transaction):
        """Add a transaction to the tree."""
        point = self._root

        for item in transaction:
            next_point = point.search(item)
            if next_point:
                # There is already a node in this tree for the current
                # transaction item; reuse it.
                next_point.increment()
            else:
                # Create a new point and add it as a child of the point we're
                # currently looking at.
                next_point = FPNode(self, item)
                point.add(next_point)

                # Update the route of nodes that contain this item to include
                # our new node.
                self._update_route(next_point)

            point = next_point

    def _update_route(self, point):
        """Add the given node to the route through all nodes for its item."""
        assert self is point.tree

        try:
            # change the tail
            route = self._routes[point.item]
            route[1].neighbor = point # route[1] is the tail
            self._routes[point.item] = self.Route(route[0], point)
        except KeyError:
            # First node for this item; start a new route.
            self._routes[point.item] = self.Route(point, point)

    def items(self):
        """
        Generate one 2-tuples for each item represented in the tree. The first
        element of the tuple is the item itself, and the second element is a
        generator that will yield the nodes in the tree that belong to the item.
        """
        for item in self._routes:
            yield (item, self.nodes(item))

    def nodes(self, item):
        """
        Generate the sequence of nodes that contain the given item.
        """

        try:
            node = self._routes[item][0]
        except KeyError:
            return

        while node:
            yield node
            node = node.neighbor

    def prefix_paths(self, item):
        """Generate the prefix paths that end with the given item."""

        def collect_path(node):
            path = []
            while node and not node.root:
                path.append(node)
                node = node.parent
            path.reverse()
            return path

        return (collect_path(node) for node in self.nodes(item))

    def inspect(self):
        print('Tree:')
        self.root.inspect(1)

        print('Routes:')
        for item, nodes in self.items():
            print( '  %r' % item)
            for node in nodes:
                print( '    %r' % node)

def conditional_tree_from_paths(paths):
    """Build a conditional FP-tree from the given prefix paths."""
    tree = FPTree()
    condition_item = None
    items = set()

    # Import the nodes in the paths into the new tree. Only the counts of the
    # leaf notes matter; the remaining counts will be reconstructed from the
    # leaf counts.
    for path in paths:
        if condition_item is None:
            condition_item = path[-1].item

        point = tree.root
        for node in path:
            next_point = point.search(node.item)
            if not next_point:
                # Add a new node to the tree.
                items.add(node.item)
                count = node.count if node.item == condition_item else 0
                next_point = FPNode(tree, node.item, count)
                point.add(next_point)
                tree._update_route(next_point)
            point = next_point

    assert condition_item is not None

    # Calculate the counts of the non-leaf nodes.
    for path in tree.prefix_paths(condition_item):
        count = path[-1].count
        for node in reversed(path[:-1]):
            node._count += count

    return tree

class FPNode(object):
    """A node in an FP tree."""

    def __init__(self, tree, item, count=1):
        self._tree = tree
        self._item = item
        self._count = count
        self._parent = None
        self._children = {}
        self._neighbor = None

    def add(self, child):
        """Add the given FPNode `child` as a child of this node."""

        if not isinstance(child, FPNode):
            raise TypeError("Can only add other FPNodes as children")

        if not child.item in self._children:
            self._children[child.item] = child
            child.parent = self

    def search(self, item):
        """
        Check whether this node contains a child node for the given item.
        If so, that node is returned; otherwise, `None` is returned.
        """
        try:
            return self._children[item]
        except KeyError:
            return None

    def __contains__(self, item):
        return item in self._children

    @property
    def tree(self):
        """The tree in which this node appears."""
        return self._tree

    @property
    def item(self):
        """The item contained in this node."""
        return self._item

    @property
    def count(self):
        """The count associated with this node's item."""
        return self._count

    def increment(self):
        """Increment the count associated with this node's item."""
        if self._count is None:
            raise ValueError("Root nodes have no associated count.")
        self._count += 1

    @property
    def root(self):
        """True if this node is the root of a tree; false if otherwise."""
        return self._item is None and self._count is None

    @property
    def leaf(self):
        """True if this node is a leaf in the tree; false if otherwise."""
        return len(self._children) == 0

    @property
    def parent(self):
        """The node's parent"""
        return self._parent

    @parent.setter
    def parent(self, value):
        if value is not None and not isinstance(value, FPNode):
            raise TypeError("A node must have an FPNode as a parent.")
        if value and value.tree is not self.tree:
            raise ValueError("Cannot have a parent from another tree.")
        self._parent = value

    @property
    def neighbor(self):
        """
        The node's neighbor; the one with the same value that is "to the right"
        of it in the tree.
        """
        return self._neighbor

    @neighbor.setter
    def neighbor(self, value):
        if value is not None and not isinstance(value, FPNode):
            raise TypeError("A node must have an FPNode as a neighbor.")
        if value and value.tree is not self.tree:
            raise ValueError("Cannot have a neighbor from another tree.")
        self._neighbor = value

    @property
    def children(self):
        """The nodes that are children of this node."""
        return tuple(self._children.itervalues())

    def inspect(self, depth=0):
        print ('  ' * depth) + repr(self)
        for child in self.children:
            child.inspect(depth + 1)

    def __repr__(self):
        if self.root:
            return "<%s (root)>" % type(self).__name__
        return "<%s %r (%r)>" % (type(self).__name__, self.item, self.count)

if __name__  == "__main__":
    file_path = '../../data/academic_clean.csv'
    df = pandas.read_csv(file_path)
    find_rules(df, minimum_support=30, min_len=1, protect_attr='gender=F', target_attr='class', elift_th=[0.9 , 1.1])